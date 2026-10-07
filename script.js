const display = document.getElementById('display');
const expression = document.getElementById('expression');
const keypad = document.querySelector('.keypad');
const operatorButtons = [...document.querySelectorAll('[data-operator]')];

let current = '0';
let stored = null;
let pendingOperator = null;
let waitingForOperand = false;
let justCalculated = false;
let completedExpression = '';

function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number.parseFloat(value.toPrecision(11));
  return String(rounded);
}

function updateDisplay() {
  display.textContent = current;
  expression.textContent = pendingOperator && stored !== null
    ? `${formatNumber(stored)} ${pendingOperator}`
    : completedExpression || '\u00a0';
  operatorButtons.forEach(button => {
    button.classList.toggle('is-selected', button.dataset.operator === pendingOperator);
  });
}

function enterDigit(digit) {
  if (current === 'Error' || waitingForOperand || justCalculated) {
    completedExpression = '';
    current = digit;
    waitingForOperand = false;
    justCalculated = false;
  } else if (current.replace('-', '').replace('.', '').length < 12) {
    current = current === '0' ? digit : current + digit;
  }
  updateDisplay();
}

function chooseOperator(operator) {
  completedExpression = '';
  const inputValue = Number(current);
  if (pendingOperator && !waitingForOperand) {
    const result = calculate(stored, inputValue, pendingOperator);
    if (result === null) {
      showError();
      return;
    }
    current = formatNumber(result);
    stored = result;
  } else {
    stored = inputValue;
  }
  pendingOperator = operator;
  waitingForOperand = true;
  justCalculated = false;
  updateDisplay();
}

function calculate(left, right, operator) {
  switch (operator) {
    case '+': return left + right;
    case '−': return left - right;
    case '×': return left * right;
    case '÷': return right === 0 ? null : left / right;
    default: return right;
  }
}

function equals() {
  if (!pendingOperator || stored === null || current === 'Error') return;
  const left = stored;
  const operator = pendingOperator;
  const right = waitingForOperand ? stored : Number(current);
  const result = calculate(left, right, operator);
  if (result === null) {
    showError();
    return;
  }
  completedExpression = `${formatNumber(left)} ${operator} ${formatNumber(right)} =`;
  current = formatNumber(result);
  stored = result;
  pendingOperator = null;
  waitingForOperand = true;
  justCalculated = true;
  updateDisplay();
}

function showError() {
  current = 'Error';
  stored = null;
  pendingOperator = null;
  waitingForOperand = true;
  justCalculated = false;
  updateDisplay();
}

function clear() {
  completedExpression = '';
  current = '0';
  stored = null;
  pendingOperator = null;
  waitingForOperand = false;
  justCalculated = false;
  updateDisplay();
}

function backspace() {
  if (current === 'Error' || waitingForOperand || justCalculated) {
    clear();
    return;
  }
  current = current.length > 1 ? current.slice(0, -1) : '0';
  if (current === '-') current = '0';
  updateDisplay();
}

function handleAction(action) {
  if (action === 'clear') clear();
  if (action === 'equals') equals();
  if (action === 'decimal') {
    if (current === 'Error' || waitingForOperand || justCalculated) {
      completedExpression = '';
      current = '0.';
      waitingForOperand = false;
      justCalculated = false;
    } else if (!current.includes('.')) {
      current += '.';
    }
    updateDisplay();
  }
  if (action === 'sign' && current !== 'Error' && Number(current) !== 0) {
    completedExpression = '';
    current = current.startsWith('-') ? current.slice(1) : `-${current}`;
    updateDisplay();
  }
  if (action === 'percent' && current !== 'Error') {
    completedExpression = '';
    current = formatNumber(Number(current) / 100);
    waitingForOperand = false;
    justCalculated = false;
    updateDisplay();
  }
}

keypad.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.digit !== undefined) enterDigit(button.dataset.digit);
  if (button.dataset.operator) chooseOperator(button.dataset.operator);
  if (button.dataset.action) handleAction(button.dataset.action);
});

document.addEventListener('keydown', event => {
  if (/^[0-9]$/.test(event.key)) enterDigit(event.key);
  else if (event.key === '.') handleAction('decimal');
  else if (event.key === 'Enter' || event.key === '=') {
    event.preventDefault();
    equals();
  } else if (event.key === 'Backspace') backspace();
  else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') clear();
  else if (event.key === '+') chooseOperator('+');
  else if (event.key === '-') chooseOperator('−');
  else if (event.key === '*') chooseOperator('×');
  else if (event.key === '/') {
    event.preventDefault();
    chooseOperator('÷');
  } else if (event.key === '%') handleAction('percent');
});

updateDisplay();
  
