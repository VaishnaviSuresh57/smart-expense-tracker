// main.js - Common functionality for the Expense Tracker application

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips if any
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseover', showTooltip);
        tooltip.addEventListener('mouseout', hideTooltip);
    });

    // Handle mobile menu toggle if in responsive mode
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Add fade-in animation to content
    const content = document.querySelector('.content');
    if (content) {
        content.classList.add('fade-in');
    }
});

// Tooltip functions
function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = this.getAttribute('data-tooltip');
    
    document.body.appendChild(tooltip);
    
    const rect = this.getBoundingClientRect();
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    tooltip.style.opacity = '1';
}

function hideTooltip() {
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(tooltip => {
        document.body.removeChild(tooltip);
    });
}

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show-mobile');
}

// Flash message function
function showFlashMessage(message, type = 'info') {
    const flashContainer = document.createElement('div');
    flashContainer.className = `flash-message ${type}`;
    
    const messageContent = document.createElement('p');
    messageContent.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(flashContainer);
    });
    
    flashContainer.appendChild(messageContent);
    flashContainer.appendChild(closeButton);
    document.body.appendChild(flashContainer);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (document.body.contains(flashContainer)) {
            document.body.removeChild(flashContainer);
        }
    }, 5000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Helper function for AJAX requests
function ajaxRequest(url, method, data, successCallback, errorCallback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    
    if (!(data instanceof FormData)) {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.responseText);
                successCallback(response);
            } catch (e) {
                successCallback(xhr.responseText);
            }
        } else {
            errorCallback(xhr.statusText);
        }
    };
    
    xhr.onerror = function() {
        errorCallback('Network error');
    };
    
    if (data instanceof FormData) {
        xhr.send(data);
    } else {
        const params = new URLSearchParams();
        for (const key in data) {
            params.append(key, data[key]);
        }
        xhr.send(params);
    }
}
