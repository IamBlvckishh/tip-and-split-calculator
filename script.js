/**
 * Copyright (c) 2025 IamBlvckishh
 * MIT License
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
    const generateBtn = document.getElementById('generate-btn');
    const shareInvoiceBtn = document.getElementById('share-invoice-btn');
    const resultsDisplayArea = document.getElementById('results-display-area');

    let splitMode = 'equal';

    const getCleanVal = (el) => parseFloat(el.value.replace(/,/g, '')) || 0;

    const formatCurrency = (amt) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencySelect.value,
        }).format(amt);
    };

    const calculate = () => {
        let baseTotal = 0, totalTip = 0;
        const people = parseInt(numPeopleInput.value) || 1;
        const personCostMap = {};

        if (modeSelect.value === 'single') {
            baseTotal = getCleanVal(billTotalInput);
            totalTip = baseTotal * (getCleanVal(tipPercentInput) / 100);
        } else {
            document.querySelectorAll('.bill-item').forEach(item => {
                const amt = getCleanVal(item.querySelector('.bill-input'));
                const tip = amt * (parseFloat(item.querySelector('.tip-input').value) / 100);
                baseTotal += amt; totalTip += tip;
            });
        }

        let totalBill = baseTotal + totalTip;

        if (splitMode === 'equal' || people <= 1) {
            let perPerson = totalBill / people;
            if (roundUpCheck.checked) perPerson = Math.ceil(perPerson);
            
            document.querySelectorAll('.person-name-input').forEach((input, i) => {
                personCostMap[input.value || `Person ${i+1}`] = perPerson;
            });
            totalBill = perPerson * people;
        } else {
            let distributed = 0;
            const groups = document.querySelectorAll('.person-input-group');
            groups.forEach((group, i) => {
                const name = group.querySelector('.person-name-input').value || `Person ${i+1}`;
                const pct = parseFloat(group.querySelector('.person-percent-input').value) || 0;
                let cost = (pct / 100) * totalBill;
                if (roundUpCheck.checked) cost = Math.ceil(cost);
                personCostMap[name] = cost;
                distributed += cost;
            });
            totalBill = distributed;
        }

        totalTipDisplay.textContent = formatCurrency(totalBill - baseTotal);
        totalWithTipDisplay.textContent = formatCurrency(totalBill);
        perPersonDisplay.textContent = formatCurrency(totalBill / people);
        resultsDisplayArea.dataset.personCosts = JSON.stringify(personCostMap);
    };

    const updateNamesList = () => {
        const count = parseInt(numPeopleInput.value) || 1;
        namesContainer.innerHTML = 'label>Split Details:</label>';
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.className = 'person-input-group';
            div.innerHTML = `<input type="text" class="person-name-input" placeholder="Person ${i+1}">`;
            if (splitMode === 'percent') {
                div.innerHTML += `<div class="percent-input-wrapper"><input type="number" class="person-percent-input" value="${(100/count).toFixed(0)}"><span>%</span></div>`;
            }
            namesContainer.appendChild(div);
        }
        namesContainer.querySelectorAll('input').forEach(i => i.addEventListener('input', calculate));
        calculate();
    };

    const setSplitMode = (mode) => {
        splitMode = mode;
        equalSplitBtn.classList.toggle('active', mode === 'equal');
        percentSplitBtn.classList.toggle('active', mode === 'percent');
        updateNamesList();
    };

    // Event Listeners
    [billTotalInput, tipPercentInput, numPeopleInput, modeSelect, currencySelect, roundUpCheck].forEach(el => {
        el.addEventListener('input', () => {
            if(el === numPeopleInput) updateNamesList();
            calculate();
        });
    });

    equalSplitBtn.addEventListener('click', () => setSplitMode('equal'));
    percentSplitBtn.addEventListener('click', () => setSplitMode('percent'));
    darkModeBtn.addEventListener('click', () => document.body.classList.toggle('dark-mode'));
    resetBtn.addEventListener('click', () => location.reload());
    
    generateBtn.addEventListener('click', () => {
        generateBtn.classList.add('hidden');
        shareInvoiceBtn.classList.remove('hidden');
    });

    updateNamesList();
});
