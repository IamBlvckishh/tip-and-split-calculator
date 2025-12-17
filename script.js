/**
 * @project Tip & Split Calculator
 * @author IamBlvckishh (https://github.com/IamBlvckishh)
 * @license MIT
 * @year 2025
 */

document.addEventListener('DOMContentLoaded', () => {
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
    const canvas = document.getElementById('invoice-canvas');
    const ctx = canvas.getContext('2d');
    const statusMessage = document.getElementById('image-generation-status');

    let splitMode = 'equal';

    const formatNumberInput = (e) => {
        let value = e.target.value;
        let cleanValue = value.replace(/[^\d.]/g, ''); 
        let parts = cleanValue.split('.');
        let formattedWhole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        let decimal = parts.length > 1 ? '.' + parts[1].substring(0, 2) : ''; 
        e.target.value = formattedWhole + decimal;
        calculate(); 
        shareInvoiceBtn.classList.add('hidden');
        generateBtn.classList.remove('hidden');
    };

    const formatCurrency = (amount) => {
        const selectedCurrency = currencySelect.value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: selectedCurrency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getCleanMonetaryValue = (inputElement) => parseFloat(inputElement.value.replace(/,/g, '')) || 0;

    const calculate = () => {
        let baseTotal = 0, totalTipAmount = 0;
        const people = parseInt(numPeopleInput.value) || 1;
        const shouldRoundUp = roundUpCheck.checked;
        const personCostMap = {};
        
        if (modeSelect.value === 'single') {
            const bill = getCleanMonetaryValue(billTotalInput); 
            baseTotal = bill;
            totalTipAmount = bill * ((parseFloat(tipPercentInput.value) || 0) / 100);
        } else {
            document.querySelectorAll('.bill-item').forEach(item => {
                const amt = getCleanMonetaryValue(item.querySelector('.bill-input'));
                baseTotal += amt;
                totalTipAmount += amt * ((parseFloat(item.querySelector('.tip-input').value) || 0) / 100);
            });
        }
        
        let totalBill = baseTotal + totalTipAmount;
        if (splitMode === 'equal') {
            let perPerson = totalBill / people;
            if (shouldRoundUp) perPerson = Math.ceil(perPerson);
            Array.from(document.querySelectorAll('.person-name-input')).forEach((input, i) => {
                personCostMap[input.value.trim() || `Person ${i+1}`] = perPerson;
            });
            perPersonDisplay.textContent = formatCurrency(perPerson);
        } else {
            const groups = Array.from(document.querySelectorAll('.person-input-group'));
            let totalDist = 0;
            groups.forEach((g, i) => {
                const pct = parseFloat(g.querySelector('.person-percent-input').value) || 0;
                let cost = totalBill * (pct / 100);
                if (shouldRoundUp) cost = Math.ceil(cost);
                personCostMap[g.querySelector('.person-name-input').value.trim() || `Person ${i+1}`] = cost;
                totalDist += cost;
            });
            perPersonDisplay.textContent = formatCurrency(totalDist / people);
        }

        totalTipDisplay.textContent = formatCurrency(totalTipAmount);
        totalWithTipDisplay.textContent = formatCurrency(totalBill);
        resultsDisplayArea.dataset.personCosts = JSON.stringify(personCostMap);
    };

    const updateNamesList = () => {
        const count = parseInt(numPeopleInput.value) || 1;
        namesContainer.innerHTML = '<label>Split Details:</label>';
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.className = 'person-input-group';
            div.innerHTML = `<input type="text" class="person-name-input" placeholder="Person ${i+1}">`;
            if (splitMode === 'percent') {
                div.innerHTML += `<div class="percent-input-wrapper"><input type="number" class="person-percent-input" value="${Math.floor(100/count)}"><span>%</span></div>`;
            }
            div.querySelectorAll('input').forEach(input => input.addEventListener('input', calculate));
            namesContainer.appendChild(div);
        }
        calculate();
    };

    const generateImageFromData = (invoiceData) => {
        const receiptWidth = 380; 
        const padding = 20;
        const column2End = receiptWidth - padding;
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Dynamic Height Calculation
        const splitRows = invoiceData.splitDetails.length;
        canvas.height = 350 + (splitRows * 30);
        canvas.width = receiptWidth;

        ctx.fillStyle = isDarkMode ? '#111' : '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = isDarkMode ? '#fff' : '#000';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("RECEIPT SUMMARY", receiptWidth / 2, 40);
        
        ctx.font = '14px monospace';
        ctx.fillText(invoiceData.title.toUpperCase(), receiptWidth / 2, 70);
        
        ctx.textAlign = 'left';
        ctx.fillText(`Total Tip: ${invoiceData.totals.tipAmount}`, padding, 120);
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`GRAND TOTAL: ${invoiceData.totals.grandTotal}`, padding, 150);
        
        ctx.textAlign = 'center';
        ctx.fillText("--- SPLIT BREAKDOWN ---", receiptWidth / 2, 190);
        
        ctx.font = '14px monospace';
        invoiceData.splitDetails.forEach((detail, i) => {
            ctx.textAlign = 'left';
            ctx.fillText(detail.name, padding, 220 + (i * 25));
            ctx.textAlign = 'right';
            ctx.fillText(detail.amount, column2End, 220 + (i * 25));
        });

        ctx.textAlign = 'center';
        ctx.font = 'italic 12px monospace';
        ctx.fillText("Thank you for using Blvckishh's Split Calculator!", receiptWidth / 2, canvas.height - 30);

        return canvas.toDataURL('image/png');
    };

    const shareInvoice = async () => {
        statusMessage.classList.remove('hidden');
        const mode = modeSelect.value;
        const invoiceData = {
            title: (mode === 'single' ? billDescriptionInput.value : 'Multiple Items') || 'Expense',
            totals: { tipAmount: totalTipDisplay.textContent, grandTotal: totalWithTipDisplay.textContent },
            splitDetails: Object.entries(JSON.parse(resultsDisplayArea.dataset.personCosts)).map(([name, amount]) => ({
                name, amount: formatCurrency(amount)
            }))
        };

        const imageURL = generateImageFromData(invoiceData);
        const blob = await (await fetch(imageURL)).blob();
        const file = new File([blob], "receipt.png", { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Bill Receipt' });
        } else {
            window.open(imageURL);
        }
        statusMessage.classList.add('hidden');
    };

    // Event Listeners
    resetBtn.addEventListener('click', () => { location.reload(); });
    darkModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        darkModeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌓';
    });
    modeSelect.addEventListener('change', () => {
        singleModeDiv.classList.toggle('hidden', modeSelect.value !== 'single');
        multipleModeDiv.classList.toggle('hidden', modeSelect.value !== 'multiple');
        if(modeSelect.value === 'multiple' && !billItemsContainer.children.length) addBillItemBtn.click();
        calculate();
    });
    addBillItemBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'bill-item';
        div.innerHTML = `<input type="text" class="desc-input" placeholder="Item"><input type="text" class="bill-input" value="0.00"><input type="number" class="tip-input" value="15"><button onclick="this.parentElement.remove();">X</button>`;
        div.querySelector('.bill-input').addEventListener('input', formatNumberInput);
        billItemsContainer.appendChild(div);
    });
    equalSplitBtn.addEventListener('click', () => { splitMode = 'equal'; equalSplitBtn.classList.add('active'); percentSplitBtn.classList.remove('active'); updateNamesList(); });
    percentSplitBtn.addEventListener('click', () => { splitMode = 'percent'; percentSplitBtn.classList.add('active'); equalSplitBtn.classList.remove('active'); updateNamesList(); });
    generateBtn.addEventListener('click', () => { calculate(); generateBtn.classList.add('hidden'); shareInvoiceBtn.classList.remove('hidden'); });
    shareInvoiceBtn.addEventListener('click', shareInvoice);
    [billTotalInput, tipPercentInput].forEach(i => i.addEventListener('input', formatNumberInput));
    numPeopleInput.addEventListener('input', updateNamesList);
    roundUpCheck.addEventListener('change', calculate);

    updateNamesList();
});
