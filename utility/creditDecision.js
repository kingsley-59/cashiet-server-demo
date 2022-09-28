

const creditDecision = ({
    indicinaAnalysisData = {},
    okraAnalysisData = {},
    lendingAmount = 0,
    balance = 0
}) => {
    let result = {
        isEligible: false,
        message: ''
    }

    const {
        behaviouralAnalysis,
        cashFlowAnalysis,
        incomeAnalysis,
        spendAnalysis,
        transactionPatternAnalysis
    } = indicinaAnalysisData ?? {}

    let initialDeposit = 0
    let monthlyDuration = 0
    let recurringAmount = 0
    if (behaviouralAnalysis?.inflowOutflowRate === "Positive Cash Flow") {
        result.isEligible = true
    } else {
        result.isEligible = false
        result.message = 'User is not eligible. Cashflow counld not meet standard.'
    }
    
    let netAvgMonthlyIncome = cashFlowAnalysis?.netAverageMonthlyEarnings
    let fractionOfIncomeToAmount = Number(netAvgMonthlyIncome / lendingAmount).toFixed(2)
    let fractionofBalToAmount = Number(balance / lendingAmount).toFixed(2)
    console.log({netAvgMonthlyIncome, fractionOfIncomeToAmount, fractionofBalToAmount})
    if (Number(fractionofBalToAmount) < 0.3) {
        result.isEligible = false
        result.message = 'User account balance is insufficient.'
    }
    if (Number(fractionOfIncomeToAmount) >= 0.5) {
        result.initialDeposit = 0.5 * lendingAmount
        result.monthlyDuration = 2
        result.recurringAmount = 0.25 * lendingAmount
    } else if (Number(fractionOfIncomeToAmount) >= 0.4) {
        result.initialDeposit = 0.4 * lendingAmount
        result.monthlyDuration = 3
        result.recurringAmount = 0.2 * lendingAmount
    } else if (Number(fractionOfIncomeToAmount) >= 0.3) {
        result.initialDeposit = 0.4 * lendingAmount
        result.monthlyDuration = 3
        result.recurringAmount = 0.2 * lendingAmount
    } else {
        result.isEligible = false
        result.message = 'User is not eligible for this transaction.'
    }
    

    return result
}


module.exports = creditDecision


// const indicinaAnalysisData = {
//     "status": "success",
//     "data": {
//         "behaviouralAnalysis": {
//             "accountSweep": "No",
//             "gamblingRate": 0,
//             "inflowOutflowRate": "Positive Cash Flow",
//             "loanAmount": 126000,
//             "loanInflowRate": 0.08,
//             "loanRepaymentInflowRate": 0,
//             "loanRepayments": 7115.17,
//             "topIncomingTransferAccount": "John Doe",
//             "topTransferRecipientAccount": "Gtb Impersonal"
//         },
//         "cashFlowAnalysis": {
//             "accountActivity": -20,
//             "averageBalance": 15846.906064814822,
//             "averageCredits": 32028.823673469386,
//             "averageDebits": 6284.452694610779,
//             "closingBalance": 393.04,
//             "firstDay": "2020-06-05",
//             "lastDay": "2020-12-02",
//             "monthPeriod": "June-December",
//             "netAverageMonthlyEarnings": 146616.36000000002,
//             "noOfTransactingMonths": 7,
//             "totalCreditTurnover": 1569412.3599999999,
//             "totalDebitTurnover": 1049503.6,
//             "yearInStatement": "2020"
//         },
//         "incomeAnalysis": {
//             "salaryEarner": "Yes",
//             "medianIncome": 100000,
//             "averageOtherIncome": 191545.45,
//             "expectedSalaryDay": 4,
//             "lastSalaryDate": "30-Nov-2020",
//             "averageSalary": 105000,
//             "confidenceIntervalonSalaryDetection": 0.92,
//             "salaryFrequency": ">1",
//             "numberSalaryPayments": 40,
//             "numberOtherIncomePayments": 11,
//             "gigWorker": "Yes"
//         },
//         "spendAnalysis": {
//             "averageRecurringExpense": 0,
//             "hasRecurringExpense": "Yes",
//             "totalExpenses": 149929.09,
//             "expenseChannels": [
//                 {
//                     "key": "atmSpend",
//                     "value": 8517.5
//                 },
//                 {
//                     "key": "webSpend",
//                     "value": 43791.73
//                 },
//                 {
//                     "key": "posSpend",
//                     "value": 0
//                 },
//                 {
//                     "key": "ussdTransactions",
//                     "value": 2974.3
//                 },
//                 {
//                     "key": "mobileSpend",
//                     "value": 58438.43
//                 },
//                 {
//                     "key": "spendOnTransfers",
//                     "value": 89251.02
//                 },
//                 {
//                     "key": "internationalTransactionsSpend",
//                     "value": 0
//                 }
//             ],
//             "expenseCategories": [
//                 {
//                     "key": "bills",
//                     "value": 641.47
//                 },
//                 {
//                     "key": "entertainment",
//                     "value": 0
//                 },
//                 {
//                     "key": "spendOnInvestments",
//                     "value": 0
//                 },
//                 {
//                     "key": "gambling",
//                     "value": 0
//                 },
//                 {
//                     "key": "airtime",
//                     "value": 3150
//                 },
//                 {
//                     "key": "bankCharges",
//                     "value": 52.73
//                 }
//             ]
//         },
//         "transactionPatternAnalysis": {
//             "MAWWZeroBalanceInAccount": {
//                 "month": "",
//                 "week_of_month": 0
//             },
//             "NODWBalanceLess5000": 49,
//             "highestMAWOCredit": {
//                 "month": "June",
//                 "week_of_month": 2
//             },
//             "highestMAWODebit": {
//                 "month": "December",
//                 "week_of_month": 1
//             },
//             "lastDateOfCredit": "2020-12-02",
//             "lastDateOfDebit": "2020-12-02",
//             "mostFrequentBalanceRange": "< 10,000",
//             "mostFrequentTransactionRange": "< 10,000",
//             "recurringExpense": [
//                 {
//                     "amount": 1000,
//                     "description": "Airtime Purchase USSD- 101CT0000000002009837523- 2348033082348 "
//                 },
//                 {
//                     "amount": 11000,
//                     "description": "OWN ACCOUNT TRANSFER MBANKING - REF:201113400000110002008 - OWN Account Transfer "
//                 },
//                 {
//                     "amount": 8575,
//                     "description": "POS/WEB PURCHASE TRANSACTION -962894- -742189-Carbor OneFI VICTORIA ISLA NG "
//                 }
//             ],
//             "transactionsBetween100000And500000": 7,
//             "transactionsBetween10000And100000": 40,
//             "transactionsGreater500000": 0,
//             "transactionsLess10000": 169
//         }
//     }
// }

// console.log(creditDecision({
//     indicinaAnalysisData: indicinaAnalysisData.data,
//     balance: 225000,
//     lendingAmount: 380000
// }))
