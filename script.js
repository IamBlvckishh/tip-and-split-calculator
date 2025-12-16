document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTION ---
    const currencySelect = document.getElementById('currency-select');
    const modeSelect = document.getElementById('mode-select');
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const roundUpCheck = document.getElementById('round-up-check');
    const resetBtn = document.getElementById('reset-btn'); // NEW: Reset Button

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


    // --- NEW: RESET FUNCTION ---
    const resetCalculator = () => {
        // Reset Inputs
        billDescriptionInput.value = '';
        billTotalInput.value = '0.00';
        tipPercentInput.value = '15';
        numPeopleInput.value = '1';
        roundUpCheck.checked = false;
        
        // Reset Modes and Containers
        modeSelect.value = 'single';
        switchMode(); // Switches the UI back to single mode and clears multiple items
        billItemsContainer.innerHTML = ''; // Ensure items are truly cleared

        // Reset Displays
        calculate(); 
        
        // Reset Button Visibility
        shareInvoiceBtn.classList.add('hidden');
        generateBtn.classList.remove('hidden');

        console.log("Calculator fields reset.");
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

    // --- 6. CANVAS IMAGE GENERATION FUNCTION (Mall Invoice Style) ---
    const generateImageFromData = (invoiceData) => {
        const receiptWidth = 380; // Standard receipt width
        const padding = 20;
        const column2End = receiptWidth - padding; // X position for the end of the right column text
        const lineHeight = 28;
        const largeGap = 15;
        const smallGap = 10;
        const fontFamily = 'monospace'; // Use monospace for receipt feel
        const boldFont = `bold 18px ${fontFamily}`;
        const regularFont = `14px ${fontFamily}`;

        // Colors
        const isDarkMode = document.body.classList.contains('dark-mode');
        const bgColor = isDarkMode ? '#111111' : '#ffffff';
        const textColor = isDarkMode ? '#ffffff' : '#000000';

        // Helper function for drawing a dotted line
        const drawDivider = (y) => {
            ctx.beginPath();
            ctx.strokeStyle = textColor;
            ctx.setLineDash([2, 3]);
            ctx.lineWidth = 1;
            ctx.moveTo(padding, y);
            ctx.lineTo(receiptWidth - padding, y);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line style
        };
        
        // Helper to wrap long text (for single bill description)
        const wrapText = (text, x, y, maxWidth, lineHeight) => {
            const words = text.split(' ');
            let line = '';
            let lines = [];

            for(let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                let testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            
            lines.forEach((l) => {
                ctx.fillText(l.trim(), x, y);
                y += lineHeight;
            });
            return y;
        };


        // --- CALCULATE HEIGHT ---
        let totalHeight = padding;
        
        // Title block
        totalHeight += 4 * lineHeight; 
        
        // Itemized List/Single Bill Description
        if (invoiceData.mode === 'multiple' && invoiceData.itemizedList.length > 0) {
            totalHeight += largeGap;
            totalHeight += invoiceData.itemizedList.length * lineHeight;
        } else {
            // Estimate height for wrapped single description (max 2 lines)
            totalHeight += 2 * lineHeight; 
        }

        // Totals Block
        totalHeight += largeGap;
        totalHeight += 3 * lineHeight; 
        totalHeight += largeGap;
        
        // Split Details Block
        totalHeight += 2 * lineHeight;
        totalHeight += invoiceData.splitDetails.length * lineHeight;
        
        totalHeight += padding; // Final buffer

        canvas.width = receiptWidth;
        canvas.height = totalHeight;

        let y = padding;

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = textColor;
        
        // --- 1. HEADER ---
        ctx.font = `bold 22px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText("RECEIPT SUMMARY", receiptWidth / 2, y);
        y += largeGap + 5;
        
        ctx.font = regularFont;
        ctx.fillText(invoiceData.title.toUpperCase(), receiptWidth / 2, y);
        y += largeGap + 15;
        
        drawDivider(y);
        y += smallGap;
        
        ctx.font = regularFont;
        ctx.textAlign = 'left';
        ctx.fillText(`Mode: ${invoiceData.mode === 'single' ? 'Single' : 'Itemized'} Split`, padding, y);
        ctx.textAlign = 'right';
        ctx.fillText(`Currency: ${invoiceData.currency}`, column2End, y);
        y += lineHeight;
        ctx.textAlign = 'left';
        ctx.fillText(`People: ${invoiceData.people}`, padding, y);
        y += largeGap;

        // --- 2. ITEMIZED BREAKDOWN ---
        if (invoiceData.mode === 'multiple' && invoiceData.itemizedList.length > 0) {
            ctx.font = `bold 14px ${fontFamily}`;
            ctx.fillText("ITEM | TIP %", padding, y);
            ctx.textAlign = 'right';
            ctx.fillText("AMOUNT", column2End, y);
            y += smallGap;

            drawDivider(y);
            y += smallGap;

            ctx.font = regularFont;
            invoiceData.itemizedList.forEach(item => {
                ctx.textAlign = 'left';
                const itemLabel = `${item.description.substring(0, 18).padEnd(18, ' ')} | ${String(item.tipPercent).padStart(2, ' ')}%`;
                ctx.fillText(itemLabel, padding, y);
                
                ctx.textAlign = 'right';
                ctx.fillText(item.amount, column2End, y);
                y += lineHeight;
            });
            drawDivider(y);
            y += smallGap;
        } else {
            // Handle single bill description wrapping
            ctx.font = regularFont;
            ctx.textAlign = 'left';
            y = wrapText(`Description: ${invoiceData.title}`, padding, y, receiptWidth - 2 * padding, lineHeight);
            y += smallGap;
            drawDivider(y);
            y += smallGap;
        }

        // --- 3. TOTALS SUMMARY ---
        ctx.fillStyle = textColor;
        ctx.font = regularFont;

        // Tip Amount
        ctx.textAlign = 'left';
        ctx.fillText("Tip Amount:", padding, y);
        ctx.textAlign = 'right';
        ctx.fillText(invoiceData.totals.tipAmount, column2End, y);
        y += lineHeight;

        // Grand Total
        ctx.font = boldFont;
        ctx.textAlign = 'left';
        ctx.fillText("GRAND TOTAL:", padding, y);
        ctx.textAlign = 'right';
        ctx.fillText(invoiceData.totals.grandTotal, column2End, y);
        y += largeGap;
        
        drawDivider(y);
        y += largeGap;


        // --- 4. SPLIT DETAILS ---
        ctx.font = `bold 16px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText("SPLIT BREAKDOWN", receiptWidth / 2, y);
        y += largeGap;
        
        ctx.font = regularFont;
        invoiceData.splitDetails.forEach(detail => {
            ctx.textAlign = 'left';
            ctx.fillText(detail.name, padding, y);
            
            ctx.textAlign = 'right';
            ctx.font = (detail.name === 'Single Payer') ? boldFont : regularFont;
            ctx.fillText(detail.amount, column2End, y);
            y += lineHeight;
        });

        drawDivider(y);
        y += smallGap;
        
        // --- Final Tagline ---
        ctx.font = `italic 12px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText("Thank you for using the Split Calculator!", receiptWidth / 2, y);

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

        // Generate Text Fallback (always ready in case image fails)
        const textFallback = `
    🧾 Invoice Summary (${invoiceData.mode === 'single' ? 'Single Bill' : 'Itemized Bill'}) 🧾

    Description: ${invoiceData.title}
    
    Total Tip Paid: ${invoiceData.totals.tipAmount}
    --------------------------
    GRAND TOTAL${isRounded ? ' (Rounded)' : ''}: ${invoiceData.totals.grandTotal}

    --- SPLIT DETAILS ---
    ${invoiceData.splitDetails.map(d => `- ${d.name}: ${d.amount}`).join('\n')}
    
    ${invoiceData.itemizedList.length > 0 ? '\n--- ITEM BREAKDOWN ---\n' + invoiceData.itemizedList.map(i => `${i.description} (${i.amount} + ${i.tipPercent}% tip)`).join('\n') : ''}
    `;

        // 2. Generate Image URL 
        await new Promise(resolve => setTimeout(resolve, 50)); 
        let imageURL;
        try {
            imageURL = generateImageFromData(invoiceData);
        } catch (e) {
            console.error("Canvas Image Generation Failed:", e);
            // CRITICAL FALLBACK: If image creation fails, fall back to text and return.
            prompt('Could not generate image. Copy the text summary below:', textFallback);
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
                 // If file sharing is not supported, provide the image link
                 prompt(`Image generated successfully. Copy this link or save the image below:`, imageURL);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Sharing was cancelled by the user.");
            } else {
                console.error("Share failed:", error);
                // If share fails *after* image generation, fall back to image URL prompt
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
    resetBtn.addEventListener('click', resetCalculator); // NEW: Reset Listener
    
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
