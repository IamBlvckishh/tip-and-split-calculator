document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTION (Added roundUpCheck) ---
    const currencySelect = document.getElementById('currency-select');
    const modeSelect = document.getElementById('mode-select');
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const roundUpCheck = document.getElementById('round-up-check'); // NEW

    const singleModeDiv = document.getElementById('single-bill-mode');
    const multipleModeDiv = document.getElementById('multiple-bills-mode');
    const billItemsContainer = document.getElementById('bill-items-container');
    const addBillItemBtn = document.getElementById('add-bill-item-btn');

    const billTotalInput = document.getElementById('bill-total');
    const tipPercentInput = document.getElementById('tip-percent');
    const numPeopleInput = document.getElementById('num-people');

    const totalTipDisplay = document.getElementById('total-tip-amount');
    const totalWithTipDisplay = document.getElementById('total-with-tip');
    const perPersonDisplay = document.getElementById('per-person-pay');
    const generateInvoiceBtn = document.getElementById('generate-invoice-btn');


    // --- 2. CURRENCY AND FORMATTING HELPERS (No Change) ---
    const getLocaleForCurrency = (currencyCode) => {
        // Simplified locale map
        switch (currencyCode) {
            case 'EUR': return 'de-DE';
            case 'GBP': return 'en-GB';
            case 'JPY': return 'ja-JP';
            case 'NGN': return 'en-NG';
            default: return 'en-US';
        }
    }

    const formatCurrency = (amount) => {
        const selectedCurrency = currencySelect.value;
        const locale = getLocaleForCurrency(selectedCurrency);
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: selectedCurrency,
            // IMPORTANT: If rounded, we still want to show decimals for clean display.
            minimumFractionDigits: 2, 
        }).format(amount);
    };


    // --- 3. MAIN CALCULATION FUNCTION (Updated for Rounding) ---
    const calculate = () => {
        let baseTotal = 0; // Total bill without tips (used for multiple mode clarity)
        let totalTipAmount = 0;
        const people = parseInt(numPeopleInput.value) || 1;
        const shouldRoundUp = roundUpCheck.checked; // Check the rounding state // NEW

        // Ensure people is at least 1
        if (people < 1) {
            numPeopleInput.value = 1;
            return calculate();
        }

        if (modeSelect.value === 'single') {
            const bill = parseFloat(billTotalInput.value) || 0;
            const tipPercent = parseFloat(tipPercentInput.value) || 0;
            
            baseTotal = bill;
            totalTipAmount = bill * (tipPercent / 100);

        } else if (modeSelect.value === 'multiple') {
            const billItems = document.querySelectorAll('.bill-item');
            
            billItems.forEach(item => {
                const billInput = item.querySelector('.bill-input');
                const tipInput = item.querySelector('.tip-input');
                
                const billAmount = parseFloat(billInput.value) || 0;
                const tipPercent = parseFloat(tipInput.value) || 0;

                const itemTip = billAmount * (tipPercent / 100);

                baseTotal += billAmount;
                totalTipAmount += itemTip;
            });
        }
        
        let totalBill = baseTotal + totalTipAmount;
        let perPersonCost = totalBill / people;
        
        // APPLY ROUNDING LOGIC // NEW
        let roundedTotalBill = totalBill; 
        let extraTipAdded = 0;

        if (shouldRoundUp) {
            const roundedPerPerson = Math.ceil(perPersonCost);
            
            // Calculate the new total bill based on the rounded per-person cost
            roundedTotalBill = roundedPerPerson * people;
            
            // Calculate how much "extra" tip was added due to rounding
            extraTipAdded = roundedTotalBill - totalBill;
            
            // The cost each person pays is now the rounded amount
            perPersonCost = roundedPerPerson; 
            
            // The displayed tip amount must be updated to include the rounding extra
            totalTipAmount += extraTipAdded;
        }

        // Update the display
        totalTipDisplay.textContent = formatCurrency(totalTipAmount);
        totalWithTipDisplay.textContent = formatCurrency(roundedTotalBill); // Use rounded total
        perPersonDisplay.textContent = formatCurrency(perPersonCost);
    };


    // --- 4. DARK MODE LOGIC (No Change) ---
    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', isDarkMode ? 'enabled' : 'disabled');
        darkModeBtn.textContent = isDarkMode ? '☀️' : '🌓';
    };

    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeBtn.textContent = '☀️';
    }

    darkModeBtn.addEventListener('click', toggleDarkMode);


    // --- 5. MODE SWITCHING AND MULTIPLE BILL LOGIC (No Change) ---
    const switchMode = () => {
        if (modeSelect.value === 'multiple') {
            singleModeDiv.classList.add('hidden');
            multipleModeDiv.classList.remove('hidden');
        } else {
            multipleModeDiv.classList.add('hidden');
            singleModeDiv.classList.remove('hidden');
        }
        calculate();
    };
    
    const createBillItem = () => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'bill-item';

        itemDiv.innerHTML = `
            <input type="number" class="bill-input" value="0.00" min="0" step="0.01" placeholder="Bill Amount">
            <input type="number" class="tip-input" value="15" min="0" max="100" step="1" placeholder="Tip %">
            <button class="remove-btn" aria-label="Remove item">X</button>
        `;
        
        itemDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        itemDiv.querySelector('.remove-btn').addEventListener('click', () => {
            itemDiv.remove();
            calculate();
        });

        billItemsContainer.appendChild(itemDiv);
        calculate();
    };
    
    if (billItemsContainer.children.length === 0) {
        createBillItem();
    }


    // --- 6. INVOICE GENERATION LOGIC (No Change) ---
    const generateInvoice = () => {
        const totalBill = totalWithTipDisplay.textContent;
        const perPersonPay = perPersonDisplay.textContent;
        const totalTip = totalTipDisplay.textContent;
        const currency = currencySelect.value;
        const people = numPeopleInput.value;
        const mode = modeSelect.value === 'single' ? 'Single Bill' : 'Multiple Bills';
        const isRounded = roundUpCheck.checked ? ' (Rounded)' : ''; // ADDED ROUNDING FLAG

        let itemizedList = '';
        if (modeSelect.value === 'multiple') {
            const items = Array.from(document.querySelectorAll('.bill-item')).map((item, index) => {
                const bill = parseFloat(item.querySelector('.bill-input').value) || 0;
                const tip = parseFloat(item.querySelector('.tip-input').value) || 0;
                return `Item ${index + 1}: ${formatCurrency(bill)} + ${tip}% Tip`;
            }).join('\n');
            itemizedList = `\n--- Items ---\n${items}`;
        }
        
        const invoiceText = `
        🧾 Tip & Split Summary (${mode}) 🧾

        Currency Used: ${currency}
        Number of People: ${people}
        
        Total Tip Paid: ${totalTip}
        --------------------------
        GRAND TOTAL${isRounded}: ${totalBill}
        
        EACH PERSON PAYS${isRounded}: ${perPersonPay}
        --------------------------
        
        ${itemizedList}
        
        #VibecodeTools
        `;

        if (navigator.share) {
            navigator.share({
                title: 'Tip & Split Invoice',
                text: invoiceText,
            }).catch(error => {
                alert('Share failed or was cancelled. Copy this text instead:\n\n' + invoiceText);
            });
        } else {
            prompt('Copy the invoice text below:', invoiceText);
        }
    };


    // --- 7. EVENT LISTENERS (Added listener for Round Up Checkbox) ---
    currencySelect.addEventListener('change', calculate);
    numPeopleInput.addEventListener('input', calculate);
    modeSelect.addEventListener('change', switchMode);
    addBillItemBtn.addEventListener('click', createBillItem);
    generateInvoiceBtn.addEventListener('click', generateInvoice);
    roundUpCheck.addEventListener('change', calculate); // NEW LISTENER

    // Single mode listeners
    billTotalInput.addEventListener('input', calculate);
    tipPercentInput.addEventListener('input', calculate);
    document.querySelectorAll('.adjust-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const fieldId = e.target.dataset.field;
            const delta = parseInt(e.target.dataset.delta);
            const inputField = document.getElementById(fieldId);

            let currentValue = parseInt(inputField.value) || 0;
            let newValue = currentValue + delta;
            
            if (fieldId === 'tip-percent' && newValue < 0) newValue = 0;
            else if (fieldId === 'num-people' && newValue < 1) newValue = 1;

            inputField.value = newValue;
            calculate();
        });
    });

    // Initial setup
    calculate();
});
