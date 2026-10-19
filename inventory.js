// inventory.js - Functionality for the inventory management page

document.addEventListener('DOMContentLoaded', function() {
    // Modal elements
    const addItemModal = document.getElementById('add-item-modal');
    const editItemModal = document.getElementById('edit-item-modal');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const closeButtons = document.querySelectorAll('.close, .cancel-btn');
    
    // Form elements
    const addItemForm = document.getElementById('add-item-form');
    const editItemForm = document.getElementById('edit-item-form');
    const addItemBtn = document.getElementById('add-item-btn');
    
    // Filter elements
    const showNeededOnly = document.getElementById('show-needed-only');
    const searchInventory = document.getElementById('search-inventory');
    
    // Button actions
    const editButtons = document.querySelectorAll('.edit-item');
    const deleteButtons = document.querySelectorAll('.delete-item');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    // Event listeners for modals
    addItemBtn.addEventListener('click', () => {
        addItemModal.style.display = 'block';
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            addItemModal.style.display = 'none';
            editItemModal.style.display = 'none';
            deleteConfirmModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === addItemModal) addItemModal.style.display = 'none';
        if (e.target === editItemModal) editItemModal.style.display = 'none';
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
    });
    
    // Add item form submission
    if (addItemForm) {
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const itemName = formData.get('item_name');
            const quantity = formData.get('quantity');
            const price = formData.get('price');
            const needed = formData.get('needed') ? 'on' : 'off';
            
            ajaxRequest('/inventory/add', 'POST', {
                item_name: itemName,
                quantity: quantity,
                price: price,
                needed: needed
            }, function(response) {
                if (response.success) {
                    // Reload the page to show the updated inventory
                    location.reload();
                } else {
                    showFlashMessage(response.error || 'Failed to add item', 'error');
                }
            }, function(error) {
                showFlashMessage('Network error: ' + error, 'error');
            });
        });
    }
    
    // Edit item functionality
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemName = this.getAttribute('data-item');
            const quantity = this.getAttribute('data-quantity');
            const price = this.getAttribute('data-price');
            const needed = this.getAttribute('data-needed') === 'True';
            
            document.getElementById('edit-item-name-original').value = itemName;
            document.getElementById('edit-item-name').value = itemName;
            document.getElementById('edit-item-quantity').value = quantity;
            document.getElementById('edit-item-price').value = price;
            document.getElementById('edit-item-needed').checked = needed;
            
            editItemModal.style.display = 'block';
        });
    });
    
    // Edit item form submission
    if (editItemForm) {
        editItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const originalName = document.getElementById('edit-item-name-original').value;
            const itemName = document.getElementById('edit-item-name').value;
            const quantity = document.getElementById('edit-item-quantity').value;
            const price = document.getElementById('edit-item-price').value;
            const needed = document.getElementById('edit-item-needed').checked ? 'on' : 'off';
            
            ajaxRequest('/inventory/update', 'POST', {
                item_name: itemName,
                quantity: quantity,
                price: price,
                needed: needed
            }, function(response) {
                if (response.success) {
                    // Reload the page to show the updated inventory
                    location.reload();
                } else {
                    showFlashMessage(response.error || 'Failed to update item', 'error');
                }
            }, function(error) {
                showFlashMessage('Network error: ' + error, 'error');
            });
        });
    }
    
    // Delete item functionality
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemName = this.getAttribute('data-item');
            document.getElementById('delete-item-name').textContent = itemName;
            deleteConfirmModal.style.display = 'block';
            
            // Set up the confirm delete button with the current item
            confirmDeleteBtn.setAttribute('data-item', itemName);
        });
    });
    
    // Confirm delete action
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            const itemName = this.getAttribute('data-item');
            
            ajaxRequest('/inventory/delete', 'POST', {
                item_name: itemName
            }, function(response) {
                if (response.success) {
                    // Reload the page to show the updated inventory
                    location.reload();
                } else {
                    showFlashMessage(response.error || 'Failed to delete item', 'error');
                }
                deleteConfirmModal.style.display = 'none';
            }, function(error) {
                showFlashMessage('Network error: ' + error, 'error');
                deleteConfirmModal.style.display = 'none';
            });
        });
    }
    
    // Filter functionality
    if (showNeededOnly) {
        showNeededOnly.addEventListener('change', filterItems);
    }
    
    if (searchInventory) {
        searchInventory.addEventListener('input', filterItems);
    }
    
    function filterItems() {
        const showNeeded = showNeededOnly.checked;
        const searchTerm = searchInventory.value.toLowerCase();
        const items = document.querySelectorAll('#inventory-items tr:not(.empty-inventory)');
        
        items.forEach(item => {
            const itemName = item.querySelector('td:first-child').textContent.toLowerCase();
            const isNeeded = item.classList.contains('needed-item');
            
            const matchesNeeded = !showNeeded || isNeeded;
            const matchesSearch = itemName.includes(searchTerm);
            
            if (matchesNeeded && matchesSearch) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Check if any items are visible
        const visibleItems = document.querySelectorAll('#inventory-items tr:not([style*="display: none"])');
        const emptyRow = document.querySelector('.empty-inventory');
        
        if (visibleItems.length === 0 && !emptyRow) {
            const tbody = document.getElementById('inventory-items');
            const newEmptyRow = document.createElement('tr');
            newEmptyRow.className = 'empty-inventory';
            newEmptyRow.innerHTML = '<td colspan="5">No items match your filter criteria</td>';
            tbody.appendChild(newEmptyRow);
        } else if (visibleItems.length > 0 && emptyRow) {
            emptyRow.remove();
        }
    }
});