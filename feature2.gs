package ifc.standalone.rulesets

uses gw.pl.currency.MonetaryAmount
uses ifc.TestBase_IFC

uses java.math.BigDecimal

class DisbursementPreupdateTest extends TestBase_IFC {
  function testApprovedDisbursementAddressChangedStatusBackToAwaitingApproval() {
    var polPeriod = DisbursementPreupdateTestFixture.createPolicyPeriodWithPremium("1000 cad")
    DisbursementPreupdateTestFixture.createDirectBillPayment(polPeriod.Policy.UnappliedFund, "1400 cad" as BigDecimal)
    var disbursement = DisbursementPreupdateTestFixture.createDisbursement(polPeriod, polPeriod.EffectiveDate, new MonetaryAmount("450 cad"))

    assertEquals(DisbursementStatus.TC_APPROVED, disbursement.Status)
    DisbursementPreupdateTestFixture.changeAddressLine1Field(disbursement)

    disbursement.refresh()
    assertEquals(DisbursementStatus.TC_AWAITINGAPPROVAL, disbursement.Status)
  }
}