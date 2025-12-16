document.addEventListener('DOMContentLoaded', () => {
    // 1. Get all relevant input and output elements
    const billTotalInput = document.getElementById('bill-total');
    const tipPercentInput = document.getElementById('tip-percent');
    const numPeopleInput = document.getElementById('num-people');

    const totalTipDisplay = document.getElementById('total-tip-amount');
    const totalWithTipDisplay = document.getElementById('total-with-tip');
    const perPersonDisplay = document.getElementById('per-person-pay');

    // 2. Main calculation function
    const calculate = () => {
        // Ensure inputs are valid numbers, defaulting to 0 or 1 if invalid
        const bill = parseFloat(billTotalInput.value) || 0;
        const tipPercent = parseFloat(tipPercentInput.value) || 0;
        const people = parseInt(numPeopleInput.value) || 1;

        // Ensure people is at least 1 to prevent division by zero
        if (people < 1) {
            numPeopleInput.value = 1;
            // Recalculate if we had to fix the number of people
            if (people !== 0) return calculate();
        }

        // Calculation Steps
        const tipAmount = bill * (tipPercent / 100);
        const totalBill = bill + tipAmount;
        const perPersonCost = totalBill / people;

        // 3. Update the display with formatted currency
        const formatCurrency = (amount) => {
            // Using toFixed(2) and Intl.NumberFormat for robust currency display
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        };

        totalTipDisplay.textContent = formatCurrency(tipAmount);
        totalWithTipDisplay.textContent = formatCurrency(totalBill);
        perPersonDisplay.textContent = formatCurrency(perPersonCost);
    };

    // 4. Input Listeners (Recalculate on any change)
    billTotalInput.addEventListener('input', calculate);
    tipPercentInput.addEventListener('input', calculate);
    numPeopleInput.addEventListener('input', calculate);

    // 5. Button Listeners (Adjuster buttons)
    document.querySelectorAll('.adjust-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const fieldId = e.target.dataset.field;
            const delta = parseInt(e.target.dataset.delta);
            const inputField = document.getElementById(fieldId);

            let currentValue = parseInt(inputField.value) || 0;
            let newValue = currentValue + delta;
            
            // Apply minimum constraints
            if (fieldId === 'tip-percent' && newValue < 0) {
                newValue = 0;
            } else if (fieldId === 'num-people' && newValue < 1) {
                newValue = 1;
            }

            inputField.value = newValue;
            calculate(); // Recalculate after button press
        });
    });

    // Run the initial calculation on load to display $0.00
    calculate();
});
