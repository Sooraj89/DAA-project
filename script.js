let items = [];

function saveItems() {
  localStorage.setItem('items', JSON.stringify(items));
}

function loadItems() {
  const defaults = [
    { name: 'Rice', weight: 2, value: 80 },
    { name: 'Oil', weight: 1, value: 100 },
    { name: 'Wheat', weight: 3, value: 90 }
  ];

  const stored = localStorage.getItem('items');
  items = stored ? JSON.parse(stored) : defaults;

  saveItems();
  renderItems();
}

document.getElementById('itemForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const name = itemName.value.trim();
  const weight = parseFloat(itemWeight.value);
  const value = parseFloat(itemValue.value);

  if (name && weight > 0 && value > 0) {
    items.push({ name, weight, value });
    renderItems();
    saveItems();
    itemForm.reset();
  }
});

function renderItems() {
  const list = document.getElementById('itemList');
  list.innerHTML = items.map((item, index) => `
    <li class="item-card">
      <div class="item-desc">
        <strong>${item.name}</strong>
        <span>₹${item.value}</span>
        <span>${item.weight}kg</span>
      </div>
      <div class="item-actions">
        <button class="edit-btn" onclick="editItem(${index})">✏️ Edit</button>
        <button onclick="deleteItem(${index})">🗑️ Delete</button>
      </div>
    </li>
  `).join('');
}

function deleteItem(index) {
  items.splice(index, 1);
  renderItems();
  saveItems();
}

function editItem(index) {
  const item = items[index];
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemWeight').value = item.weight;
  document.getElementById('itemValue').value = item.value;
  items.splice(index, 1);
  renderItems();
  saveItems();
}

document.getElementById('calculateBtn').addEventListener('click', () => {
  const maxWeight = parseFloat(document.getElementById('maxWeight').value);
  const algo = document.getElementById('algorithm').value;

  if (items.length === 0 || isNaN(maxWeight)) {
    return alert("Please add items and weight!");
  }

  const bar = document.getElementById('progressBar');
  bar.style.display = 'block';
  bar.firstElementChild.style.width = '0%';

  setTimeout(() => {
    let result;
    if (algo === '01') {
      result = zeroOneKnapsack(items, maxWeight);
      result.approach = "0/1 Knapsack (Dynamic Programming)";
    } else {
      const strategy = document.getElementById('greedyStrategy').value;
      result = fractionalKnapsack(items, maxWeight, strategy);
      const strategyMap = {
        ratio: "Profit-to-Weight Ratio",
        value: "Maximum Profit",
        weight: "Minimum Weight"
      };
      result.approach = `Fractional Knapsack (Greedy - ${strategyMap[strategy]})`;
    }

    renderResult(result, maxWeight);
    bar.firstElementChild.style.animation = 'loadProgress 1s forwards';
    setTimeout(() => bar.style.display = 'none', 1000);
  }, 300);
});

document.getElementById('algorithm').addEventListener('change', e => {
  document.getElementById('greedyOptions').style.display = e.target.value === 'fractional' ? 'block' : 'none';
});

function renderResult(result, maxWeight) {
  const div = document.getElementById('result');
  const usedWeight = result.totalWeight.toFixed(2);
  const totalWeight = maxWeight.toFixed(2);
  const valueText = `<strong>💰 Total Value:</strong> ₹${result.totalValue.toFixed(2)}`;
  const capacityLine = `
    <strong>🧺 Bag Capacity:</strong> ${totalWeight}kg &nbsp;&nbsp;|&nbsp;&nbsp; 
    <strong>📦 Used:</strong> ${usedWeight}kg
  `;
  const approachText = `<strong>🧠 Approach:</strong> ${result.approach}`;

  div.innerHTML = `
    <div class="result-top">
      <div>${capacityLine}</div>
      <div>${valueText}</div>
    </div>
    <div class="result-bottom">${approachText}</div>
    <ul class="result-items">
      ${result.selectedItems.map(item => `
        <li>🛒 ${item.name} 
        (${item.fraction !== 1 ? `${(item.fraction * item.weight).toFixed(2)}kg × ₹${(item.fraction * item.value).toFixed(2)}` : `${item.weight}kg, ₹${item.value}`})</li>
      `).join('')}
    </ul>
  `;
}

// 0/1 Knapsack
function zeroOneKnapsack(items, maxW) {
  const n = items.length;
  const dp = Array(n + 1).fill().map(() => Array(maxW + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const { weight, value } = items[i - 1];
    for (let w = 0; w <= maxW; w++) {
      dp[i][w] = weight <= w
        ? Math.max(dp[i - 1][w], value + dp[i - 1][w - weight])
        : dp[i - 1][w];
    }
  }

  let w = maxW;
  const selected = [];
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      const item = items[i - 1];
      selected.push({ ...item, fraction: 1 });
      w -= item.weight;
    }
  }

  return { totalValue: dp[n][maxW], totalWeight: maxW - w, selectedItems: selected.reverse() };
}

// Fractional Knapsack
function fractionalKnapsack(items, maxW, strategy) {
  const sorted = [...items].sort((a, b) => {
    if (strategy === 'ratio') return b.value / b.weight - a.value / a.weight;
    if (strategy === 'value') return b.value - a.value;
    if (strategy === 'weight') return a.weight - b.weight;
  });

  let totalWeight = 0, totalValue = 0;
  const selected = [];

  for (const item of sorted) {
    if (totalWeight + item.weight <= maxW) {
      totalWeight += item.weight;
      totalValue += item.value;
      selected.push({ ...item, fraction: 1 });
    } else {
      const remaining = maxW - totalWeight;
      const fraction = remaining / item.weight;
      totalWeight += remaining;
      totalValue += item.value * fraction;
      selected.push({ ...item, fraction });
      break;
    }
  }
  return { totalValue, totalWeight, selectedItems: selected };
}

loadItems();
