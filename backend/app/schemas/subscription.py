from app.core.base_schema import Schema


class PlanOut(Schema):
    id:            str
    name:          str
    price_monthly: float   # camelCase: priceMonthly
    currency:      str
    features:      list[str]
    is_current:    bool    # camelCase: isCurrent


class BillingInfoOut(Schema):
    next_billing_date:    str | None   # camelCase: nextBillingDate
    payment_method:       str | None   # camelCase: paymentMethod
    last_invoice_amount:  float | None # camelCase: lastInvoiceAmount


class UpgradeRequest(Schema):
    plan_id: str  # camelCase: planId
