package ifc.standalone.rulesets

uses ifc.DataBuilderHelper
uses gw.api.util.DateUtil
uses ifc.TestBase_IFC
uses ifc.TestBaseFixture_IFC

class BillingInstructionPreupdateTest extends TestBase_IFC {
  private static final var PREMIUM  = "2000 cad"
  private static final var PREMIUM_NEGATIVE  = "-2000 cad"

  function testBIAutomaticallyClosingTroubleTicketHistoryEntryIsCreated() {
    var account = DataBuilderHelper.createAccountCurrentReferenceEffectiveDate(UWCompany.TC_010.Code, Jurisdiction.TC_AB.Code, null)
    var policyPeriod = DataBuilderHelper.issuePolicyPeriod(account, DateUtil.currentDate())

    TestBaseFixture_IFC.createTroubleTicket(account, TroubleTicketType.TC_INTERNALREQUEST_IFC, TroubleTicketSubType_IFC.TC_PENDINGCANCELLATION)
    DataBuilderHelper.cancelPolicyPeriod(policyPeriod, DateUtil.currentDate(), CancellationSource_IFC.TC_CARRIER)

    assertTrue(account.History.hasMatch( \ history -> history.EventType == HistoryEventType.TC_TROUBLETICKETCLOSED))
  }

  function testFirstInvoicePaidReinstatePolicyPeriodScheduleIsNotChanged() {
    var account = BillingInstructionPreupdateTestFixture.createEFTAccountPolicyBillingLevel()
    var policyPeriod = DataBuilderHelper.issuePolicyPeriod(account, DateUtil.currentDate(), PREMIUM)

    BillingInstructionPreupdateTestFixture.makeInvoiceBilled(account.Invoices.minBy( \ invoice -> invoice.DueDate))
    BillingInstructionPreupdateTestFixture.makePaymentRequestDrafted(account.PaymentRequests.first())

    var invoiceDueAmounts= account.Invoices*.AmountDue.where( \ amount -> !amount.IsZero)
    var cancellation = DataBuilderHelper.cancelPolicyPeriod(policyPeriod, DateUtil.currentDate(), CancellationSource_IFC.TC_CARRIER, PREMIUM_NEGATIVE)
    var reinstatement = DataBuilderHelper.reinstatePolicyPeriod(cancellation.PolicyPeriod, DateUtil.currentDate(), PREMIUM)

    assertArrayEquals(invoiceDueAmounts, reinstatement.PolicyPeriod.Account.Invoices*.AmountDue.where( \ amount -> !amount.IsZero))
  }

}