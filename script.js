/**
 * @project Tip & Split Calculator
 * @author IamBlvckishh (https://github.com/IamBlvckishh)
 * @license MIT
 * @year 2025
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTION ---
    const currencySelect = document.getElementById('currency-select');
    const modeSelect = document.getElementById('mode-select');
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const roundUpCheck = document.getElementById('round-up-check');
    const resetBtn = document.getElementById('reset-btn'); 

    const singleModeDiv = document.getElementById('single-bill-mode');
    const multipleModeDiv = document.getElementById('multiple-bills-mode');
    const billItemsContainer = document.getElementById('bill-items-container');
    const addBillItemBtn = document.getElementById('add-bill-item-btn');

    const billDescriptionInput = document.getElementById('bill-description');
    const billTotalInput = document.getElementById('bill-total');
    const tipPercentInput = document.getElementById('tip-percent');
    const numPeopleInput = document.getElementById('num-people');
    
    const namesContainer = document.getElementById('names-container');
    const equalSplitBtn = document.getElementById('equal-split-btn');
    const percentSplitBtn = document.getElementById('percent-split-btn');

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

    // --- 2. GLOBAL STATE ---
    let splitMode = 'equal'; // 'equal' or 'percent'


    // --- 3. INPUT FORMATTING FUNCTION ---
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

    // --- 4. CURRENCY AND FORMATTING HELPERS ---
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


    // --- 5. RESET FUNCTION ---
    const resetCalculator = () => {
        billDescriptionInput.value = '';
        billTotalInput.value = '0.00';
        tipPercentInput.value = '15';
        numPeopleInput.value = '1';
        roundUpCheck.checked = false;
        
        modeSelect.value = 'single';
        switchMode(); 
        billItemsContainer.innerHTML = ''; 
        setSplitMode('equal'); 

        calculate(); 
        
        shareInvoiceBtn.classList.add('hidden');
        generateBtn.classList.remove('hidden');
    };


    // --- 6. CORE CALCULATION FUNCTION ---
    const calculate = () => {
        let baseTotal = 0;
        let totalTipAmount = 0;
        const people = parseInt(numPeopleInput.value) || 1;
        const shouldRoundUp = roundUpCheck.checked;
        const personCostMap = {};
        
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
                const billAmount = getCleanMonetaryValue(item.querySelector('.bill-input')); 
                const tipPercent = parseFloat(item.querySelector('.tip-input').value) || 0;
                const itemTip = billAmount * (tipPercent / 100);
                baseTotal += billAmount;
                totalTipAmount += itemTip;
            });
        }
        
        let totalBill = baseTotal + totalTipAmount;
        let roundedTotalBill = totalBill;
        let perPersonCost = 0;
        
        if (splitMode === 'equal' || people <= 1) {
            perPersonCost = totalBill / people;
            if (shouldRoundUp) {
                perPersonCost = Math.ceil(perPersonCost);
            }
            roundedTotalBill = perPersonCost * people; 
            const personNameInputs = Array.from(document.querySelectorAll('.person-name-input'));
            personNameInputs.forEach((input, index) => {
                const name = input.value.trim() || `Person ${index + 1}`;
                personCostMap[name] = perPersonCost;
            });
            
        } else if (splitMode === 'percent') {
            const personInputs = Array.from(document.querySelectorAll('.person-input-group'));
            let totalPercentage = 0;
            let percentageData = [];

            personInputs.forEach(group => {
                const name = group.querySelector('.person-name-input').value.trim();
                const percent = parseFloat(group.querySelector('.person-percent-input').value) || 0;
                totalPercentage += percent;
                percentageData.push({ name, percent });
            });

            const adjustmentFactor = totalPercentage > 0 ? totalBill / totalPercentage : 0;
            let totalDistributed = 0;

            percentageData.forEach((data, index) => {
                let cost = 0;
                let calculatedCost = data.percent * adjustmentFactor;

                if (index < percentageData.length - 1) {
                    cost = Math.floor(calculatedCost * 100) / 100;
                } else {
                    cost = totalBill - totalDistributed; 
                }
                
                if (shouldRoundUp) {
                    cost = Math.ceil(cost);
                }
                
                personCostMap[data.name || `Person ${index + 1}`] = cost;
                totalDistributed += cost;
            });
            
            roundedTotalBill = Object.values(personCostMap).reduce((sum, cost) => sum + cost, 0);
            perPersonCost = roundedTotalBill / people;
        }

        let finalTipAmount = roundedTotalBill - baseTotal; 
        totalTipDisplay.textContent = formatCurrency(finalTipAmount);
        totalWithTipDisplay.textContent = formatCurrency(roundedTotalBill);
        perPersonDisplay.textContent = formatCurrency(perPersonCost);
        resultsDisplayArea.dataset.personCosts = JSON.stringify(personCostMap);
    };
    
    // --- 7. HELPER: Dynamically update person inputs ---
    const updateNamesList = () => {
        const peopleCount = parseInt(numPeopleInput.value) || 1;
        const existingData = Array.from(namesContainer.querySelectorAll('.person-input-group')).map(group => ({
            name: group.querySelector('.person-name-input').value,
            percent: group.querySelector('.person-percent-input') ? group.querySelector('.person-percent-input').value : '',
        }));
        
        namesContainer.innerHTML = '';

        if (peopleCount > 1) {
            const heading = document.createElement('label');
            heading.textContent = 'Split Details:';
            namesContainer.appendChild(heading);

            for (let i = 0; i < peopleCount; i++) {
                const data = existingData[i] || {};
                const namePlaceholder = `Person ${i + 1}`;
                const groupDiv = document.createElement('div');
                groupDiv.className = 'person-input-group';
                
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'person-name-input';
                nameInput.placeholder = data.name || namePlaceholder;
                nameInput.value = data.name || '';
                nameInput.addEventListener('input', calculate); 
                groupDiv.appendChild(nameInput);
                
                if (splitMode === 'percent') {
                    const percentWrapper = document.createElement('div');
                    percentWrapper.className = 'percent-input-wrapper';
                    const percentInput = document.createElement('input');
                    percentInput.type = 'number';
                    percentInput.className = 'person-percent-input';
                    percentInput.placeholder = '0';
                    percentInput.value = data.percent || Math.floor(100 / peopleCount); 
                    percentInput.min = '0';
                    percentInput.addEventListener('input', calculate);
                    percentWrapper.appendChild(percentInput);
                    const percentSign = document.createElement('span');
                    percentSign.textContent = '%';
                    percentWrapper.appendChild(percentSign);
                    groupDiv.appendChild(percentWrapper);
                }
                namesContainer.appendChild(groupDiv);
            }
        } else if (peopleCount === 1) {
            const data = existingData[0] || {};
            const groupDiv = document.createElement('div');
            groupDiv.className = 'person-input-group';
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'person-name-input';
            nameInput.placeholder = 'Payer Name (e.g., Jane Doe)';
            nameInput.value = data.name || '';
            nameInput.addEventListener('input', calculate);
            groupDiv.appendChild(nameInput);
            namesContainer.appendChild(groupDiv);
        }
        calculate();
    };

    // --- 8. GENERATE & VIEW INVOICE FUNCTION ---
    const generateAndViewInvoice = () => {
        calculate();
        generateBtn.classList.add('hidden');
        shareInvoiceBtn.classList.remove('hidden');
    }

    // --- 9. CANVAS IMAGE GENERATION FUNCTION ---
    const generateImageFromData = (invoiceData) => {
        const receiptWidth = 380; 
        const padding = 20;
        const column2End = receiptWidth - padding; 
        const lineHeight = 28;
        const largeGap = 15;
        const smallGap = 10;
        const fontFamily = 'monospace'; 
        const boldFont = `bold 18px ${fontFamily}`;
        const regularFont = `14px ${fontFamily}`;

        const isDarkMode = document.body.classList.contains('dark-mode');
        const bgColor = isDarkMode ? '#111111' : '#ffffff';
        const textColor = isDarkMode ? '#ffffff' : '#000000';

        const drawDivider = (y) => {
            ctx.beginPath();
            ctx.strokeStyle = textColor;
            ctx.setLineDash([2, 3]);
            ctx.lineWidth = 1;
            ctx.moveTo(padding, y);
            ctx.lineTo(receiptWidth - padding, y);
            ctx.stroke();
            ctx.setLineDash([]); 
        };
        
        const wrapText = (text, x, y, maxWidth, lineHeight) => {
            const words = text.split(' ');
            let line = '';
            let lines = [];
            for(let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
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

        let totalHeight = padding + (4 * lineHeight);
        if (invoiceData.mode === 'multiple' && invoiceData.itemizedList.length > 0) {
            totalHeight += largeGap + (invoiceData.itemizedList.length * lineHeight);
        } else {
            totalHeight += 2 * lineHeight; 
        }
        totalHeight += largeGap + (3 * lineHeight) + largeGap + (2 * lineHeight) + (invoiceData.splitDetails.length * lineHeight) + padding;

        canvas.width = receiptWidth;
        canvas.height = totalHeight;
        let y = padding;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = textColor;
        
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
            ctx.font = regularFont;
            ctx.textAlign = 'left';
            y = wrapText(`Description: ${invoiceData.title}`, padding, y, receiptWidth - 2 * padding, lineHeight);
            y += smallGap;
            drawDivider(y);
            y += smallGap;
        }

        ctx.fillStyle = textColor;
        ctx.font = regularFont;
        ctx.textAlign = 'left';
        ctx.fillText("Tip Amount:", padding, y);
        ctx.textAlign = 'right';
        ctx.fillText(invoiceData.totals.tipAmount, column2End, y);
        y += lineHeight;

        ctx.font = boldFont;
        ctx.textAlign = 'left';
        ctx.fillText("GRAND TOTAL:", padding, y);
        ctx.textAlign = 'right';
        ctx.fillText(invoiceData.totals.grandTotal, column2End, y);
        y += largeGap;
        drawDivider(y);
        y += largeGap;

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
        ctx.font = `italic 12px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText("Thank you for using Blvckishh's Split Calculator!", receiptWidth / 2, y);

        return canvas.toDataURL('image/png');
    };

    // --- 10. SHARE INVOICE FUNCTION ---
    const shareInvoice = async () => {
        calculate(); 
        statusMessage.classList.remove('hidden');
        shareInvoiceBtn.disabled = true;

        const currency = currencySelect.value;
        const people = parseInt(numPeopleInput.value) || 1;
        const mode = modeSelect.value;
        const isRounded = roundUpCheck.checked;

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
        
        const personCostsJson = resultsDisplayArea.dataset.personCosts;
        const personCostMap = personCostsJson ? JSON.parse(personCostsJson) : {};

        if (Object.keys(personCostMap).length > 0) {
            invoiceData.splitDetails = Object.entries(personCostMap).map(([name, amount]) => ({
                name: name,
                amount: formatCurrency(amount)
            }));
        } else {
             invoiceData.splitDetails = [{ 
                 name: document.querySelector('.person-name-input') ? document.querySelector('.person-name-input').value.trim() || 'Single Payer' : 'Single Payer',
                 amount: invoiceData.totals.grandTotal
             }];
        }

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

        await new Promise(resolve => setTimeout(resolve, 50)); 
        let imageURL;
        try {
            imageURL = generateImageFromData(invoiceData);
        } catch (e) {
            console.error("Image Generation Failed:", e);
            statusMessage.classList.add('hidden');
            shareInvoiceBtn.disabled = false;
            return; 
        }

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
                 window.open(imageURL);
            }
        } catch (error) {
            console.error("Share failed:", error);
        } finally {
            statusMessage.classList.add('hidden');
            shareInvoiceBtn.disabled = false;
        }
    };


    // --- 11. HELPER FUNCTIONS AND EVENT LISTENERS ---
    
    const setSplitMode = (mode) => {
        splitMode = mode;
        equalSplitBtn.classList.remove('active');
        percentSplitBtn.classList.remove('active');
        document.getElementById(`${mode}-split-btn`).classList.add('active');
        updateNamesList(); 
    };

    const switchMode = () => {
        if (modeSelect.value === 'multiple') {
            singleModeDiv.classList.add('hidden');
            multipleModeDiv.classList.remove('hidden');
            if (billItemsContainer.children.length === 0) createBillItem();
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
            <input type="text" class="desc-input" placeholder="Pizza">
            <input type="text" class="bill-input" value="0.00">
            <input type="number" class="tip-input" value="15" min="0">
            <button class="remove-btn">X</button>
        `;
        itemDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', input.classList.contains('bill-input') ? formatNumberInput : calculate);
        });
        itemDiv.querySelector('.remove-btn').addEventListener('click', () => {
            itemDiv.remove();
            calculate();
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

    currencySelect.addEventListener('change', calculate);
    modeSelect.addEventListener('change', switchMode);
    addBillItemBtn.addEventListener('click', createBillItem);
    roundUpCheck.addEventListener('change', calculate);
    darkModeBtn.addEventListener('click', toggleDarkMode);
    resetBtn.addEventListener('click', resetCalculator); 
    equalSplitBtn.addEventListener('click', () => setSplitMode('equal'));
    percentSplitBtn.addEventListener('click', () => setSplitMode('percent'));
    generateBtn.addEventListener('click', generateAndViewInvoice);
    shareInvoiceBtn.addEventListener('click', shareInvoice);

    billDescriptionInput.addEventListener('input', calculate);
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
            let newValue = (parseInt(inputField.value) || 0) + delta;
            if (fieldId === 'tip-percent' && newValue < 0) newValue = 0;
            else if (fieldId === 'num-people' && newValue < 1) newValue = 1;
            inputField.value = newValue;
            if (fieldId === 'num-people') updateNamesList();
            calculate();
        });
    });

    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeBtn.textContent = '☀️';
    }

    updateNamesList();
});
