// insights.js - Functionality for the insights page

document.addEventListener('DOMContentLoaded', function() {
    // Handle update inventory button
    const updateInventoryBtn = document.getElementById('update-inventory-btn');
    if (updateInventoryBtn) {
        updateInventoryBtn.addEventListener('click', handleUpdateInventory);
    }

    // Handle filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterInsights);
    });

    // Handle sort options
    const sortSelect = document.getElementById('sort-insights');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortInsights);
    }

    // Initialize charts if any
    initializeCharts();
});

// Handle update inventory from insights
function handleUpdateInventory(e) {
    e.preventDefault();
    
    // Get all selected items to update
    const selectedItems = document.querySelectorAll('.insight-item input[type="checkbox"]:checked');
    const itemsToUpdate = Array.from(selectedItems).map(checkbox => {
        const itemRow = checkbox.closest('.insight-item');
        return {
            item: itemRow.getAttribute('data-item'),
            action: itemRow.getAttribute('data-action'),
            quantity: itemRow.getAttribute('data-quantity'),
            price: itemRow.getAttribute('data-price')
        };
    });
    
    if (itemsToUpdate.length === 0) {
        showFlashMessage('No items selected for update', 'warning');
        return;
    }
    
    // Send update request
    ajaxRequest('/insights/update-inventory', 'POST', { items: JSON.stringify(itemsToUpdate) }, 
        function(response) {
            if (response.success) {
                showFlashMessage('Inventory updated successfully!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showFlashMessage('Error updating inventory: ' + response.error, 'error');
            }
        },
        function(error) {
            showFlashMessage('Error updating inventory', 'error');
        }
    );
}

// Handle filter insights
function handleFilterInsights(e) {
    const filterType = this.getAttribute('data-filter');
    
    // Remove active class from all buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    this.classList.add('active');
    
    // Show/hide relevant sections
    const insightSections = document.querySelectorAll('.insight-section');
    insightSections.forEach(section => {
        if (filterType === 'all' || section.getAttribute('data-type') === filterType) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

// Handle sort insights
function handleSortInsights(e) {
    const sortValue = this.value;
    const insightSections = document.querySelectorAll('.insight-section');
    
    insightSections.forEach(section => {
        const items = Array.from(section.querySelectorAll('.insight-item'));
        
        items.sort((a, b) => {
            let valueA, valueB;
            
            switch (sortValue) {
                case 'name':
                    valueA = a.getAttribute('data-item').toLowerCase();
                    valueB = b.getAttribute('data-item').toLowerCase();
                    return valueA.localeCompare(valueB);
                
                case 'price-low':
                    valueA = parseFloat(a.getAttribute('data-price') || 0);
                    valueB = parseFloat(b.getAttribute('data-price') || 0);
                    return valueA - valueB;
                
                case 'price-high':
                    valueA = parseFloat(a.getAttribute('data-price') || 0);
                    valueB = parseFloat(b.getAttribute('data-price') || 0);
                    return valueB - valueA;
                
                case 'quantity':
                    valueA = parseInt(a.getAttribute('data-quantity') || 0);
                    valueB = parseInt(b.getAttribute('data-quantity') || 0);
                    return valueB - valueA;
                
                default:
                    return 0;
            }
        });
        
        // Remove existing items
        items.forEach(item => {
            section.querySelector('.insight-items').removeChild(item);
        });
        
        // Add sorted items
        items.forEach(item => {
            section.querySelector('.insight-items').appendChild(item);
        });
    });
}

// Initialize charts
function initializeCharts() {
    const spendingChartCanvas = document.getElementById('spending-chart');
    if (spendingChartCanvas && window.Chart) {
        // Get spending data from the page
        const spendingData = JSON.parse(spendingChartCanvas.getAttribute('data-spending') || '[]');
        
        // Create chart
        new Chart(spendingChartCanvas, {
            type: 'bar',
            data: {
                labels: spendingData.map(item => item.category),
                datasets: [{
                    label: 'Spending by Category',
                    data: spendingData.map(item => item.amount),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    const savingsChartCanvas = document.getElementById('savings-chart');
    if (savingsChartCanvas && window.Chart) {
        // Get savings data from the page
        const savingsData = JSON.parse(savingsChartCanvas.getAttribute('data-savings') || '[]');
        
        // Create chart
        new Chart(savingsChartCanvas, {
            type: 'pie',
            data: {
                labels: ['Saved', 'Spent'],
                datasets: [{
                    data: [savingsData.saved || 0, savingsData.spent || 0],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(255, 99, 132, 0.5)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true
            }
        });
    }
}