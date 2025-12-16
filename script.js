document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTION ---
    const currencySelect = document.getElementById('currency-select');
    const modeSelect = document.getElementById('mode-select');
    const darkModeBtn = document.getElementById('dark-mode-btn');

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


    // --- 2. CURRENCY AND FORMATTING HELPERS ---
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
            minimumFractionDigits: 2,
        }).format(amount);
    };


    // --- 3. MAIN CALCULATION FUNCTION (Handles both modes) ---
    const calculate = () => {
        let totalBill = 0;
        let totalTipAmount = 0;
        const people = parseInt(numPeopleInput.value) || 1;

        // Ensure people is at least 1
        if (people < 1) {
            numPeopleInput.value = 1;
            return calculate();
        }

        if (modeSelect.value === 'single') {
            // SINGLE BILL MODE LOGIC
            const bill = parseFloat(billTotalInput.value) || 0;
            const tipPercent = parseFloat(tipPercentInput.value) || 0;

            totalTipAmount = bill * (tipPercent / 100);
            totalBill = bill + totalTipAmount;

        } else if (modeSelect.value === 'multiple') {
            // MULTIPLE BILLS MODE LOGIC
            const billItems = document.querySelectorAll('.bill-item');
            
            billItems.forEach(item => {
                const billInput = item.querySelector('.bill-input');
                const tipInput = item.querySelector('.tip-input');
                
                const billAmount = parseFloat(billInput.value) || 0;
                const tipPercent = parseFloat(tipInput.value) || 0;

                const itemTip = billAmount * (tipPercent / 100);

                totalTipAmount += itemTip;
                totalBill += billAmount;
            });

            totalBill += totalTipAmount; // Total bill includes the total calculated tips

        }
        
        // Final shared calculations
        const perPersonCost = totalBill / people;

        // Update the display
        totalTipDisplay.textContent = formatCurrency(totalTipAmount);
        totalWithTipDisplay.textContent = formatCurrency(totalBill);
        perPersonDisplay.textContent = formatCurrency(perPersonCost);
    };


    // --- 4. DARK MODE LOGIC ---
    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-mode');
        // Store user preference in local storage
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', isDarkMode ? 'enabled' : 'disabled');
        darkModeBtn.textContent = isDarkMode ? '☀️' : '🌓';
    };

    // Load preference on start
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeBtn.textContent = '☀️';
    }

    darkModeBtn.addEventListener('click', toggleDarkMode);


    // --- 5. MODE SWITCHING AND MULTIPLE BILL LOGIC ---
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
    
    // Function to create a new line item in Multiple Mode
    const createBillItem = () => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'bill-item';

        itemDiv.innerHTML = `
            <input type="number" class="bill-input" value="0.00" min="0" step="0.01" placeholder="Bill Amount">
            <input type="number" class="tip-input" value="15" min="0" max="100" step="1" placeholder="Tip %">
            <button class="remove-btn" aria-label="Remove item">X</button>
        `;
        
        // Add listeners for the new inputs
        itemDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        // Add listener for the remove button
        itemDiv.querySelector('.remove-btn').addEventListener('click', () => {
            itemDiv.remove();
            calculate();
        });

        billItemsContainer.appendChild(itemDiv);
        calculate(); // Recalculate after adding a new item
    };
    
    // Initialize with one item in multiple mode
    if (billItemsContainer.children.length === 0) {
        createBillItem();
    }


    // --- 6. INVOICE GENERATION LOGIC ---
    const generateInvoice = () => {
        // Retrieve final results
        const totalBill = totalWithTipDisplay.textContent;
        const perPersonPay = perPersonDisplay.textContent;
        const totalTip = totalTipDisplay.textContent;
        const currency = currencySelect.value;
        const people = numPeopleInput.value;
        const mode = modeSelect.value === 'single' ? 'Single Bill' : 'Multiple Bills';

        // Collect itemized list for Multiple Mode
        let itemizedList = '';
        if (modeSelect.value === 'multiple') {
            const items = Array.from(document.querySelectorAll('.bill-item')).map((item, index) => {
                const bill = parseFloat(item.querySelector('.bill-input').value) || 0;
                const tip = parseFloat(item.querySelector('.tip-input').value) || 0;
                return `Item ${index + 1}: ${formatCurrency(bill)} + ${tip}% Tip`;
            }).join('\n');
            itemizedList = `\n--- Items ---\n${items}`;
        }
        
        // Simple text summary
        const invoiceText = `
        🧾 Tip & Split Summary (${mode}) 🧾

        Currency Used: ${currency}
        Number of People: ${people}
        
        Total Tip Paid: ${totalTip}
        --------------------------
        GRAND TOTAL: ${totalBill}
        
        EACH PERSON PAYS: ${perPersonPay}
        --------------------------
        
        ${itemizedList}
        
        #VibecodeTools
        `;

        // The Web Share API is the modern, non-invasive way to share.
        if (navigator.share) {
            navigator.share({
                title: 'Tip & Split Invoice',
                text: invoiceText,
            }).catch(error => {
                // Fallback for desktop or unsupported browsers
                alert('Share failed or was cancelled. Copy this text instead:\n\n' + invoiceText);
            });
        } else {
            // Fallback for unsupported browsers
            prompt('Copy the invoice text below:', invoiceText);
        }
    };


    // --- 7. EVENT LISTENERS ---
    // Universal listeners
    currencySelect.addEventListener('change', calculate);
    numPeopleInput.addEventListener('input', calculate);
    modeSelect.addEventListener('change', switchMode);
    addBillItemBtn.addEventListener('click', createBillItem);
    generateInvoiceBtn.addEventListener('click', generateInvoice);

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
