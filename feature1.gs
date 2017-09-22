package ifc.bc.helper.bdi

uses java.util.HashMap
uses java.util.concurrent.locks.ReentrantLock
uses java.util.concurrent.locks.Lock
uses gw.api.system.BCLoggerCategory
uses java.util.Date

/**
 * Helper class which holds pair of user / BDI request parameters
 */
class BDIUserRequestHelper {

  static private var _userParamsMap : HashMap<String,BDIUserParamHolder> = new HashMap<String,BDIUserParamHolder>()
  static private final var _myLock: Lock = new ReentrantLock()
  static private final var _logger = BCLoggerCategory.AUTHENTICATION

  static function storeUserParams(user: String, policyNumber: String, company: String, province: String, policyEffectiveDate: Date) {

    using(_myLock as IMonitorLock) {
      var holder = new BDIUserParamHolder()
      holder.BDIPolicyNumber = policyNumber
      holder.BDICompany = company
      holder.BDIProvince = province
      holder.BDIPolicyEffectiveDate = policyEffectiveDate

      _userParamsMap.put(user, holder)

      _logger.info("BDIUserRequestHelper: stored BDI request params for user<" + user + "> [policyNumber="+policyNumber+", company="+company+", province="+province+", policyeffectivedate="+policyEffectiveDate)
    }
  }

  static function getUserParameters(user: String): BDIUserParamHolder {
    using(_myLock as IMonitorLock) {
     return _userParamsMap.get(user)
    }
  }

  static function flushUserParameters(user: String) {
    using(_myLock as IMonitorLock) {
      _userParamsMap.remove(user)

      _logger.info("BDIUserRequestHelper: flushed BDI request parameters for user<"+user+">")
    }
  }

  static function getAccountFromParameters(user: String): Account {
    using(_myLock as IMonitorLock) {
      var params = getUserParameters(user)

      if(params != null){
        var account = gw.api.database.Query.make(Account).compare("ReferencePolicyNumber_IFC", Equals, params.BDIPolicyNumber)
            .compareCompanyConsiderLegal_IFC("ReferenceCompany_IFC", UWCompany.get(params.BDICompany))
            .compare("ReferenceProvince_IFC", Equals, Jurisdiction.get(params.BDIProvince)).select().FirstResult

        if(account != null) {
          _logger.info("BDIUserRequestHelper: found account ["+account+"], user=" + user + ", company="+ params.BDICompany + ", province="+params.BDIProvince + ", policyNumber="+ params.BDIPolicyNumber)
        } else {
          _logger.error("BDIUserRequestHelper: cannot find account !, user=" + user + ", company="+ params.BDICompany + ", province="+params.BDIProvince + ", policyNumber="+ params.BDIPolicyNumber)
        }

        return account
      }

      return null
    }

  }

  static function getSelectablePolicyPeriodFromParameters(user: String, account: Account): PolicyPeriod {
    using(_myLock as IMonitorLock) {
      var params = getUserParameters(user)

      // Here, check for a selectable policy period term if there is at least 1 recent policy period on the account
      if(params != null && account.PolicyPeriods?.Count > 0 && params.BDIPolicyEffectiveDate != null) {
        var policyPeriod = account.RecentPolicyPeriods.where( \ elt -> elt.PolicyPerEffDate.equals(params.BDIPolicyEffectiveDate)).first()

        _logger.info("BDIUserRequestHelper: found selectable policy period for user<"+user+"> ["+policyPeriod.PolicyNumberLong+"]")

        return policyPeriod
      }

      return null
    }
  }
}