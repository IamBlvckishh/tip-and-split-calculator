document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTION (Added billDescriptionInput) ---
    const currencySelect = document.getElementById('currency-select');
    const modeSelect = document.getElementById('mode-select');
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const roundUpCheck = document.getElementById('round-up-check');

    const singleModeDiv = document.getElementById('single-bill-mode');
    const multipleModeDiv = document.getElementById('multiple-bills-mode');
    const billItemsContainer = document.getElementById('bill-items-container');
    const addBillItemBtn = document.getElementById('add-bill-item-btn');

    const billDescriptionInput = document.getElementById('bill-description'); // NEW
    const billTotalInput = document.getElementById('bill-total');
    const tipPercentInput = document.getElementById('tip-percent');
    const numPeopleInput = document.getElementById('num-people');

    const totalTipDisplay = document.getElementById('total-tip-amount');
    const totalWithTipDisplay = document.getElementById('total-with-tip');
    const perPersonDisplay = document.getElementById('per-person-pay');
    const generateInvoiceBtn = document.getElementById('generate-invoice-btn');


    // --- 2. CURRENCY AND FORMATTING HELPERS (No Change) ---
    const getLocaleForCurrency = (currencyCode) => {
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
            minimumFractionDigits: 2,
        }).format(amount);
    };


    // --- 3. MAIN CALCULATION FUNCTION (No logic change needed) ---
    const calculate = () => {
        let baseTotal = 0;
        let totalTipAmount = 0;
        const people = parseInt(numPeopleInput.value) || 1;
        const shouldRoundUp = roundUpCheck.checked;

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
        
        // APPLY ROUNDING LOGIC
        let roundedTotalBill = totalBill; 
        let extraTipAdded = 0;

        if (shouldRoundUp) {
            const roundedPerPerson = Math.ceil(perPersonCost);
            
            roundedTotalBill = roundedPerPerson * people;
            extraTipAdded = roundedTotalBill - totalBill;
            
            perPersonCost = roundedPerPerson; 
            totalTipAmount += extraTipAdded;
        }

        // Update the display
        totalTipDisplay.textContent = formatCurrency(totalTipAmount);
        totalWithTipDisplay.textContent = formatCurrency(roundedTotalBill);
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


    // --- 5. MODE SWITCHING AND MULTIPLE BILL LOGIC (Updated createBillItem) ---
    const switchMode = () => {
        if (modeSelect.value === 'multiple') {
            singleModeDiv.classList.add('hidden');
            multipleModeDiv.classList.remove('hidden');
            // Ensure at least one item exists when switching to multiple mode
            if (billItemsContainer.children.length === 0) {
                 createBillItem();
            }
        } else {
            multipleModeDiv.classList.add('hidden');
            singleModeDiv.classList.remove('hidden');
        }
        calculate();
    };
    
    // Updated function to include a description field for each item
    const createBillItem = () => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'bill-item';

        itemDiv.innerHTML = `
            <input type="text" class="desc-input" placeholder="Item Name (e.g., Pizza)">
            <input type="number" class="bill-input" value="0.00" min="0" step="0.01" placeholder="Amount">
            <input type="number" class="tip-input" value="15" min="0" max="100" step="1" placeholder="Tip %">
            <button class="remove-btn" aria-label="Remove item">X</button>
        `;
        
        // Add listeners for the new inputs (including the description text input)
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
    
    // Initial setup for multiple mode
    if (billItemsContainer.children.length === 0) {
        createBillItem();
    }


    // --- 6. INVOICE GENERATION LOGIC (Major Update for Descriptions) ---
    const generateInvoice = () => {
        const totalBill = totalWithTipDisplay.textContent;
        const perPersonPay = perPersonDisplay.textContent;
        const totalTip = totalTipDisplay.textContent;
        const currency = currencySelect.value;
        const people = numPeopleInput.value;
        const mode = modeSelect.value === 'single' ? 'Single Bill' : 'Multiple Bills';
        const isRounded = roundUpCheck.checked ? ' (Rounded)' : '';

        let mainDescription = '';
        let itemizedList = '';

        if (modeSelect.value === 'single') {
            // Get single description and use it as the main description
            mainDescription = billDescriptionInput.value.trim() || 'General Expense';

        } else if (modeSelect.value === 'multiple') {
            // Set a general description for the whole multiple bill
            mainDescription = 'Multiple Items Expense'; 
            
            // Build the itemized list
            const items = Array.from(document.querySelectorAll('.bill-item')).map((item, index) => {
                const description = item.querySelector('.desc-input').value.trim() || `Item ${index + 1}`;
                const bill = parseFloat(item.querySelector('.bill-input').value) || 0;
                const tip = parseFloat(item.querySelector('.tip-input').value) || 0;
                
                return `[${description}] ${formatCurrency(bill)} + ${tip}% Tip`;
            }).join('\n');
            
            itemizedList = `\n--- Item Details ---\n${items}`;
        }
        
        const invoiceText = `
        🧾 Tip & Split Summary (${mode}) 🧾
        
        DESCRIPTION: ${mainDescription}
        
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
                title: `Invoice: ${mainDescription}`,
                text: invoiceText,
            }).catch(error => {
                alert('Share failed or was cancelled. Copy this text instead:\n\n' + invoiceText);
            });
        } else {
            prompt('Copy the invoice text below:', invoiceText);
        }
    };


    // --- 7. EVENT LISTENERS ---
    currencySelect.addEventListener('change', calculate);
    numPeopleInput.addEventListener('input', calculate);
    modeSelect.addEventListener('change', switchMode);
    addBillItemBtn.addEventListener('click', createBillItem);
    generateInvoiceBtn.addEventListener('click', generateInvoice);
    roundUpCheck.addEventListener('change', calculate);

    // Single mode listeners (Added listener for description input)
    billDescriptionInput.addEventListener('input', generateInvoice); // Only need to update invoice, not recalculate
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
