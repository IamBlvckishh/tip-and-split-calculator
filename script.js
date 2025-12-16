document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTION (No Change) ---
    const currencySelect = document.getElementById('currency-select');
    const modeSelect = document.getElementById('mode-select');
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const roundUpCheck = document.getElementById('round-up-check');

    const singleModeDiv = document.getElementById('single-bill-mode');
    const multipleModeDiv = document.getElementById('multiple-bills-mode');
    const billItemsContainer = document.getElementById('bill-items-container');
    const addBillItemBtn = document.getElementById('add-bill-item-btn');

    const billDescriptionInput = document.getElementById('bill-description');
    const billTotalInput = document.getElementById('bill-total');
    const tipPercentInput = document.getElementById('tip-percent');
    const numPeopleInput = document.getElementById('num-people');
    
    const namesContainer = document.getElementById('names-container');

    const totalTipDisplay = document.getElementById('total-tip-amount');
    const totalWithTipDisplay = document.getElementById('total-with-tip');
    const perPersonDisplay = document.getElementById('per-person-pay');
    
    const resultsDisplayArea = document.getElementById('results-display-area'); 
    const generateBtn = document.getElementById('generate-btn');               
    const shareInvoiceBtn = document.getElementById('share-invoice-btn');       


    // --- 2. INPUT FORMATTING FUNCTION (No Change) ---
    const formatNumberInput = (e) => {
        let value = e.target.value;

        let cleanValue = value.replace(/[^\d.]/g, ''); 
        
        let parts = cleanValue.split('.');
        let whole = parts[0];
        let decimal = parts.length > 1 ? '.' + parts[1].substring(0, 2) : ''; 

        let formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        e.target.value = formattedWhole + decimal;
        
        calculate(); 
        
        shareInvoiceBtn.classList.add('hidden');
        generateBtn.classList.remove('hidden');
    };

    // --- 3. CURRENCY AND FORMATTING HELPERS (No Change) ---
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

    const getCleanMonetaryValue = (inputElement) => {
        return parseFloat(inputElement.value.replace(/,/g, '')) || 0;
    };


    // --- 4. CORE CALCULATION FUNCTION (No Change) ---
    const calculate = () => {
        let baseTotal = 0;
        let totalTipAmount = 0;
        const people = parseInt(numPeopleInput.value) || 1;
        const shouldRoundUp = roundUpCheck.checked;

        if (people < 1) {
            numPeopleInput.value = 1;
            updateNamesList(); 
            return calculate();
        }

        if (modeSelect.value === 'single') {
            const bill = getCleanMonetaryValue(billTotalInput); 
            const tipPercent = parseFloat(tipPercentInput.value) || 0;
            baseTotal = bill;
            totalTipAmount = bill * (tipPercent / 100);

        } else if (modeSelect.value === 'multiple') {
            const billItems = document.querySelectorAll('.bill-item');
            billItems.forEach(item => {
                const billInput = item.querySelector('.bill-input');
                const tipInput = item.querySelector('.tip-input');
                const billAmount = getCleanMonetaryValue(billInput); 
                const tipPercent = parseFloat(tipInput.value) || 0;
                const itemTip = billAmount * (tipPercent / 100);
                baseTotal += billAmount;
                totalTipAmount += itemTip;
            });
        }
        
        let totalBill = baseTotal + totalTipAmount;
        let perPersonCost = totalBill / people;
        
        let roundedTotalBill = totalBill; 
        let extraTipAdded = 0;

        if (shouldRoundUp) {
            const roundedPerPerson = Math.ceil(perPersonCost);
            roundedTotalBill = roundedPerPerson * people;
            extraTipAdded = roundedTotalBill - totalBill;
            perPersonCost = roundedPerPerson; 
            totalTipAmount += extraTipAdded;
        }

        totalTipDisplay.textContent = formatCurrency(totalTipAmount);
        totalWithTipDisplay.textContent = formatCurrency(roundedTotalBill);
        perPersonDisplay.textContent = formatCurrency(perPersonCost);
    };


    // --- 5. GENERATE & VIEW INVOICE FUNCTION (No Change) ---
    const generateAndViewInvoice = () => {
        calculate();
        generateBtn.classList.add('hidden');
        shareInvoiceBtn.classList.remove('hidden');
    }


    // --- 6. SHARE INVOICE FUNCTION (FIXED: Handling user cancellation silently) ---
    const shareInvoice = () => {
        calculate(); 
        
        const totalBill = totalWithTipDisplay.textContent;
        const perPersonPay = perPersonDisplay.textContent;
        const totalTip = totalTipDisplay.textContent;
        const currency = currencySelect.value;
        const people = numPeopleInput.value;
        const mode = modeSelect.value === 'single' ? 'Single Bill' : 'Multiple Bills';
        const isRounded = roundUpCheck.checked ? ' (Rounded)' : '';

        const personNameInputs = Array.from(document.querySelectorAll('.person-name-input'));
        
        let mainDescription = '';
        let itemizedList = '';
        let splitDetails = '';

        if (modeSelect.value === 'single') {
            mainDescription = billDescriptionInput.value.trim() || 'General Expense';
        } else if (modeSelect.value === 'multiple') {
            mainDescription = 'Multiple Items Expense'; 
            
            const items = Array.from(document.querySelectorAll('.bill-item')).map((item, index) => {
                const description = item.querySelector('.desc-input').value.trim() || `Item ${index + 1}`;
                const bill = getCleanMonetaryValue(item.querySelector('.bill-input'));
                const tip = parseFloat(item.querySelector('.tip-input').value) || 0;
                
                return `[${description}] ${formatCurrency(bill)} + ${tip}% Tip`;
            }).join('\n');
            
            itemizedList = `\n--- Item Details ---\n${items}`;
        }
        
        if (people > 1) {
            const costPerPerson = perPersonDisplay.textContent;
            
            const namedSplit = personNameInputs.map(input => {
                const name = input.value.trim() || input.placeholder;
                return `- ${name}: ${costPerPerson}`;
            }).join('\n');
            
            splitDetails = `
            --- SPLIT DETAILS ---
            ${namedSplit}
            `;
        } else {
             const name = personNameInputs[0] ? personNameInputs[0].value.trim() || 'Single Payer' : 'Single Payer';
             splitDetails = `
            --- PAYMENT ---
            ${name} pays the full amount.
            `;
        }

        const invoiceText = `
        🧾 Tip & Split Summary (${mode}) 🧾
        
        DESCRIPTION: ${mainDescription}
        
        Currency Used: ${currency}
        Number of People: ${people}
        
        Total Tip Paid: ${totalTip}
        --------------------------
        GRAND TOTAL${isRounded}: ${totalBill}
        
        ${splitDetails}

        --------------------------
        ${itemizedList}
        
        #VibecodeTools
        `;

        if (navigator.share) {
            navigator.share({
                title: `Invoice: ${mainDescription}`,
                text: invoiceText,
            }).catch(error => {
                // Check if the error is due to user cancellation (AbortError)
                if (error.name === 'AbortError' || error.message === 'Share cancelled') {
                    // Do nothing, silence the cancellation.
                    console.log("Sharing was cancelled by the user.");
                } else {
                    // If it's a real error (e.g., share not supported, failed), show the prompt.
                    console.error("Share failed:", error);
                    prompt('Copy the invoice text below:', invoiceText);
                }
            });
        } else {
            prompt('Copy the invoice text below:', invoiceText);
        }
    };


    // --- 7. HELPER FUNCTIONS (No Change) ---
    
    const updateNamesList = () => {
        const peopleCount = parseInt(numPeopleInput.value) || 1;
        const existingInputs = Array.from(namesContainer.querySelectorAll('input'));
        const existingNames = existingInputs.map(input => input.value);
        namesContainer.innerHTML = '';
        if (peopleCount > 1) {
            const heading = document.createElement('label');
            heading.textContent = 'Who is splitting the bill?';
            namesContainer.appendChild(heading);
            for (let i = 0; i < peopleCount; i++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'person-name-input';
                input.placeholder = existingNames[i] || `Person ${i + 1}`;
                input.value = existingNames[i] || '';
                namesContainer.appendChild(input);
            }
        }
    };

    const switchMode = () => {
        if (modeSelect.value === 'multiple') {
            singleModeDiv.classList.add('hidden');
            multipleModeDiv.classList.remove('hidden');
            if (billItemsContainer.children.length === 0) {
                 createBillItem();
            }
        } else {
            multipleModeDiv.classList.add('hidden');
            singleModeDiv.classList.remove('hidden');
        }
        calculate();
        shareInvoiceBtn.classList.add('hidden');
        generateBtn.classList.remove('hidden');
    };

    const createBillItem = () => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'bill-item';
        itemDiv.innerHTML = `
            <input type="text" class="desc-input" placeholder="Item Name (e.g., Pizza)">
            <input type="text" class="bill-input" value="0.00" placeholder="Amount">
            <input type="number" class="tip-input" value="15" min="0" max="100" step="1" placeholder="Tip %">
            <button class="remove-btn" aria-label="Remove item">X</button>
        `;
        itemDiv.querySelectorAll('input').forEach(input => {
            if (input.classList.contains('bill-input')) {
                input.addEventListener('input', formatNumberInput); 
            } else {
                input.addEventListener('input', () => {
                    calculate();
                    shareInvoiceBtn.classList.add('hidden');
                    generateBtn.classList.remove('hidden');
                }); 
            }
        });
        itemDiv.querySelector('.remove-btn').addEventListener('click', () => {
            itemDiv.remove();
            calculate();
            shareInvoiceBtn.classList.add('hidden');
            generateBtn.classList.remove('hidden');
        });
        billItemsContainer.appendChild(itemDiv);
        calculate();
    };
    
    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', isDarkMode ? 'enabled' : 'disabled');
        darkModeBtn.textContent = isDarkMode ? '☀️' : '🌓';
    };


    // --- 8. EVENT LISTENERS (FIXED: Bill Description Input) ---
    currencySelect.addEventListener('change', calculate);
    modeSelect.addEventListener('change', switchMode);
    addBillItemBtn.addEventListener('click', createBillItem);
    roundUpCheck.addEventListener('change', calculate);
    darkModeBtn.addEventListener('click', toggleDarkMode);
    
    // Primary Button Actions
    generateBtn.addEventListener('click', generateAndViewInvoice);
    shareInvoiceBtn.addEventListener('click', shareInvoice);

    // Input Change Listeners 
    // FIXED: billDescriptionInput now uses a simple listener to reset the share button
    billDescriptionInput.addEventListener('input', () => {
        calculate();
        shareInvoiceBtn.classList.add('hidden');
        generateBtn.classList.remove('hidden');
    }); 
    
    // Monetary inputs use formatNumberInput
    billTotalInput.addEventListener('input', formatNumberInput); 
    tipPercentInput.addEventListener('input', formatNumberInput); 

    // Listeners that trigger names list updates or calculation
    numPeopleInput.addEventListener('input', () => {
        updateNamesList();
        formatNumberInput({target: numPeopleInput}); 
    });

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
            
            if (fieldId === 'num-people') {
                updateNamesList();
            }
            
            calculate();
            shareInvoiceBtn.classList.add('hidden');
            generateBtn.classList.remove('hidden');
        });
    });

    // Initial setup
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeBtn.textContent = '☀️';
    } else {
        darkModeBtn.textContent = '🌓';
    }

    if (billItemsContainer.children.length === 0 && modeSelect.value === 'multiple') {
        createBillItem();
    }
    
    updateNamesList();
    calculate();
});
