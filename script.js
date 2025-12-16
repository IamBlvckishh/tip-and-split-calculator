document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTION ---
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
    
    // Canvas elements for in-app image generation
    const canvas = document.getElementById('invoice-canvas');
    const ctx = canvas.getContext('2d');
    const statusMessage = document.getElementById('image-generation-status');


    // --- 2. INPUT FORMATTING FUNCTION ---
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

    // --- 3. CURRENCY AND FORMATTING HELPERS ---
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


    // --- 4. CORE CALCULATION FUNCTION ---
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


    // --- 5. GENERATE & VIEW INVOICE FUNCTION ---
    const generateAndViewInvoice = () => {
        calculate();
        generateBtn.classList.add('hidden');
        shareInvoiceBtn.classList.remove('hidden');
    }

    // --- 6. CANVAS IMAGE GENERATION FUNCTION ---
    const generateImageFromData = (invoiceData) => {
        const padding = 30;
        const lineHeight = 30;
        const regularFont = '18px sans-serif';
        const boldFont = 'bold 18px sans-serif';

        const isDarkMode = document.body.classList.contains('dark-mode');
        const bgColor = isDarkMode ? '#000000' : '#ffffff';
        const textColor = isDarkMode ? '#f8f8f8' : '#000000';
        const accentColor = isDarkMode ? '#222222' : '#eeeeee';

        let contentLines = 8; 
        contentLines += invoiceData.splitDetails.length;
        if (invoiceData.itemizedList && invoiceData.itemizedList.length > 0) {
            contentLines += 2; 
            contentLines += invoiceData.itemizedList.length;
        }
        
        canvas.width = 400; 
        canvas.height = contentLines * lineHeight + 2 * padding;

        let y = padding;

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Text Styles
        ctx.fillStyle = textColor;
        
        // TITLE
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("INVOICE SUMMARY", canvas.width / 2, y);
        y += lineHeight + 15;
        
        ctx.font = regularFont;
        ctx.textAlign = 'left';

        // DESCRIPTION & HEADER
        ctx.fillText(`Description: ${invoiceData.title}`, padding, y);
        y += lineHeight;
        ctx.fillText(`People: ${invoiceData.people} | Currency: ${invoiceData.currency}`, padding, y);
        y += lineHeight + 10;
        
        // TOTALS AREA (Accent Background)
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, y - 5, canvas.width, lineHeight * 3 + 5);
        ctx.fillStyle = textColor;
        
        // Total Tip
        ctx.font = regularFont;
        ctx.fillText("Total Tip Amount:", padding, y);
        ctx.textAlign = 'right';
        ctx.fillText(invoiceData.totals.tipAmount, canvas.width - padding, y);
        y += lineHeight;

        // Total with Tip
        ctx.fillText("Total with Tip:", padding, y);
        ctx.textAlign = 'right';
        ctx.fillText(invoiceData.totals.grandTotal, canvas.width - padding, y);
        y += lineHeight + 5;
        
        // Final Split
        ctx.font = boldFont;
        ctx.fillText("Each Person Pays:", padding, y);
        ctx.textAlign = 'right';
        ctx.fillText(invoiceData.totals.perPerson, canvas.width - padding, y);
        y += lineHeight + 15;
        
        // SPLIT DETAILS
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText("PAYMENT SPLIT:", padding, y);
        y += lineHeight;

        ctx.font = regularFont;
        invoiceData.splitDetails.forEach(detail => {
            ctx.fillText(detail.name, padding, y);
            ctx.textAlign = 'right';
            ctx.fillText(detail.amount, canvas.width - padding, y);
            y += lineHeight;
            ctx.textAlign = 'left'; 
        });

        // ITEMIZED LIST
        if (invoiceData.itemizedList && invoiceData.itemizedList.length > 0) {
            y += 10;
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText("ITEM BREAKDOWN:", padding, y);
            y += lineHeight;

            ctx.font = '14px sans-serif';
            invoiceData.itemizedList.forEach(item => {
                const itemText = `${item.description} (${item.tipPercent}% tip)`;
                ctx.fillText(itemText, padding, y);
                ctx.textAlign = 'right';
                ctx.fillText(item.amount, canvas.width - padding, y);
                y += lineHeight - 5;
                ctx.textAlign = 'left';
            });
        }
        
        // Convert canvas to image URL
        return canvas.toDataURL('image/png');
    };

    // --- 7. SHARE INVOICE FUNCTION ---
    const shareInvoice = async () => {
        calculate(); 
        statusMessage.classList.remove('hidden');
        shareInvoiceBtn.disabled = true;

        const currency = currencySelect.value;
        const people = parseInt(numPeopleInput.value) || 1;
        const mode = modeSelect.value;
        const isRounded = roundUpCheck.checked;

        // 1. Prepare Data Object
        const invoiceData = {
            mode: mode,
            title: (mode === 'single' ? billDescriptionInput.value.trim() : 'Multiple Items Expense') || 'General Expense',
            currency: currency,
            people: people,
            isRounded: isRounded,
            totals: {
                tipAmount: totalTipDisplay.textContent,
                grandTotal: totalWithTipDisplay.textContent,
                perPerson: perPersonDisplay.textContent
            },
            splitDetails: [],
            itemizedList: [],
        };
        
        // Prepare Split Details
        if (people > 1) {
            const personNameInputs = Array.from(document.querySelectorAll('.person-name-input'));
            invoiceData.splitDetails = personNameInputs.map((input, index) => ({
                name: input.value.trim() || `Person ${index + 1}`,
                amount: invoiceData.totals.perPerson
            }));
        } else {
             invoiceData.splitDetails = [{ 
                 name: document.querySelector('.person-name-input') ? document.querySelector('.person-name-input').value.trim() || 'Single Payer' : 'Single Payer',
                 amount: invoiceData.totals.grandTotal
             }];
        }

        // Prepare Item Details
        if (mode === 'multiple') {
            invoiceData.itemizedList = Array.from(document.querySelectorAll('.bill-item')).map((item, index) => {
                const bill = getCleanMonetaryValue(item.querySelector('.bill-input'));
                const tip = parseFloat(item.querySelector('.tip-input').value) || 0;
                
                return {
                    description: item.querySelector('.desc-input').value.trim() || `Item ${index + 1}`,
                    amount: formatCurrency(bill),
                    tipPercent: tip,
                };
            });
        }

        // 2. Generate Image URL 
        await new Promise(resolve => setTimeout(resolve, 50)); 
        let imageURL;
        try {
            imageURL = generateImageFromData(invoiceData);
        } catch (e) {
            console.error("Canvas Image Generation Failed:", e);
            alert("Could not generate image for sharing. Try copying the link manually.");
            statusMessage.classList.add('hidden');
            shareInvoiceBtn.disabled = false;
            return;
        }

        // 3. Use Web Share API for the image file
        try {
            const response = await fetch(imageURL);
            const blob = await response.blob();
            const file = new File([blob], "invoice_summary.png", { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Invoice: ${invoiceData.title}`,
                    text: `Tip & Split Summary: ${invoiceData.totals.grandTotal}`,
                });
            } else {
                 prompt(`Image generated successfully. Copy this link or save the image below:`, imageURL);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Sharing was cancelled by the user.");
            } else {
                console.error("Share failed:", error);
                // Fallback to image URL prompt
                prompt('Share failed or unsupported. Copy this image link instead:', imageURL);
            }
        } finally {
            statusMessage.classList.add('hidden');
            shareInvoiceBtn.disabled = false;
        }
    };


    // --- 8. HELPER FUNCTIONS AND EVENT LISTENERS ---
    
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

    // Event Listeners
    currencySelect.addEventListener('change', calculate);
    modeSelect.addEventListener('change', switchMode);
    addBillItemBtn.addEventListener('click', createBillItem);
    roundUpCheck.addEventListener('change', calculate);
    darkModeBtn.addEventListener('click', toggleDarkMode);
    
    generateBtn.addEventListener('click', generateAndViewInvoice);
    shareInvoiceBtn.addEventListener('click', shareInvoice);

    billDescriptionInput.addEventListener('input', () => {
        calculate();
        shareInvoiceBtn.classList.add('hidden');
        generateBtn.classList.remove('hidden');
    }); 
    
    billTotalInput.addEventListener('input', formatNumberInput); 
    tipPercentInput.addEventListener('input', formatNumberInput); 

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
