/**
 * MCPM 开发者门户 UI辅助模块
 * 
 * 提供通用的UI组件和操作
 */

const UI = (function() {
  /**
   * 显示模态窗口
   * @param {Object} options - 模态窗口选项
   * @param {string} options.title - 模态窗口标题
   * @param {string|HTMLElement} options.content - 模态窗口内容
   * @param {Array<{text: string, type: string, handler: Function}>} options.buttons - 模态窗口按钮
   * @param {Function} options.onClose - 关闭回调函数
   * @returns {Object} - 模态窗口控制对象
   */
  function showModal(options) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;
    
    // 创建模态窗口元素
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // 创建模态窗口头部
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = options.title || '提示';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', closeModal);
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // 创建模态窗口主体
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    if (typeof options.content === 'string') {
      modalBody.innerHTML = options.content;
    } else if (options.content instanceof HTMLElement) {
      modalBody.appendChild(options.content);
    }
    
    // 创建模态窗口底部
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    // 添加按钮
    if (options.buttons && options.buttons.length) {
      options.buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = `btn btn-${button.type || 'outline'}`;
        btn.textContent = button.text;
        
        if (button.handler) {
          btn.addEventListener('click', (event) => {
            button.handler(event);
            if (button.closeOnClick !== false) {
              closeModal();
            }
          });
        } else {
          btn.addEventListener('click', closeModal);
        }
        
        modalFooter.appendChild(btn);
      });
    } else {
      // 默认添加确定按钮
      const confirmButton = document.createElement('button');
      confirmButton.className = 'btn btn-primary';
      confirmButton.textContent = '确定';
      confirmButton.addEventListener('click', closeModal);
      modalFooter.appendChild(confirmButton);
    }
    
    // 组装模态窗口
    modal.appendChild(modalHeader);
    modal.appendChild(modalBody);
    modal.appendChild(modalFooter);
    
    // 清空并添加到容器
    modalContainer.innerHTML = '';
    modalContainer.appendChild(modal);
    
    // 显示模态窗口
    modalContainer.classList.add('active');
    
    // 添加ESC键关闭
    const escHandler = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // 关闭模态窗口函数
    function closeModal() {
      modalContainer.classList.remove('active');
      document.removeEventListener('keydown', escHandler);
      
      // 延迟移除模态窗口内容
      setTimeout(() => {
        modalContainer.innerHTML = '';
      }, 300);
      
      // 调用关闭回调
      if (options.onClose) {
        options.onClose();
      }
    }
    
    // 返回控制对象
    return {
      close: closeModal,
      getElement: () => modal
    };
  }
  
  /**
   * 确认对话框
   * @param {string} message - 确认消息
   * @param {Object} options - 对话框选项
   * @returns {Promise<boolean>} - 用户选择结果
   */
  function confirm(message, options = {}) {
    return new Promise((resolve) => {
      showModal({
        title: options.title || '确认',
        content: message,
        buttons: [
          {
            text: options.cancelText || '取消',
            type: 'outline',
            handler: () => resolve(false)
          },
          {
            text: options.confirmText || '确定',
            type: options.confirmType || 'primary',
            handler: () => resolve(true)
          }
        ]
      });
    });
  }
  
  /**
   * 显示提示消息
   * @param {string} type - 提示类型 (success, warning, error)
   * @param {string} message - 提示消息
   * @param {Object} options - 提示选项
   */
  function showToast(type, message, options = {}) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // 添加图标
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle toast-icon"></i>';
        break;
      case 'warning':
        icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>';
        break;
      case 'error':
        icon = '<i class="fas fa-times-circle toast-icon"></i>';
        break;
      default:
        icon = '<i class="fas fa-info-circle toast-icon"></i>';
    }
    
    toast.innerHTML = `${icon}${message}`;
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 自动移除
    const duration = options.duration || 3000;
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      
      // 延迟移除元素
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
  
  /**
   * 创建并返回表单字段元素
   * @param {Object} field - 字段配置
   * @returns {HTMLElement} - 表单字段元素
   */
  function createFormField(field) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    // 创建标签
    if (field.label) {
      const label = document.createElement('label');
      label.className = 'form-label';
      label.setAttribute('for', field.id);
      label.textContent = field.label;
      
      if (field.required) {
        label.innerHTML += ' <span class="required">*</span>';
      }
      
      formGroup.appendChild(label);
    }
    
    let input;
    
    // 创建输入元素
    switch (field.type) {
      case 'select':
        input = document.createElement('select');
        input.className = 'form-select';
        
        // 添加选项
        if (field.options) {
          field.options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.text;
            
            if (option.value === field.value) {
              optionEl.selected = true;
            }
            
            input.appendChild(optionEl);
          });
        }
        break;
        
      case 'textarea':
        input = document.createElement('textarea');
        input.className = 'form-textarea';
        if (field.value) {
          input.value = field.value;
        }
        break;
        
      case 'checkbox':
        input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'form-checkbox';
        if (field.checked) {
          input.checked = true;
        }
        break;
        
      default:
        input = document.createElement('input');
        input.type = field.type || 'text';
        input.className = 'form-input';
        if (field.value) {
          input.value = field.value;
        }
    }
    
    // 设置通用属性
    input.id = field.id;
    input.name = field.name || field.id;
    
    if (field.placeholder) {
      input.placeholder = field.placeholder;
    }
    
    if (field.required) {
      input.required = true;
    }
    
    if (field.disabled) {
      input.disabled = true;
    }
    
    if (field.pattern) {
      input.pattern = field.pattern;
    }
    
    // 添加事件监听器
    if (field.onChange) {
      input.addEventListener('change', field.onChange);
    }
    
    if (field.onInput) {
      input.addEventListener('input', field.onInput);
    }
    
    // 添加输入元素
    formGroup.appendChild(input);
    
    // 添加帮助文本
    if (field.helpText) {
      const helpText = document.createElement('small');
      helpText.className = 'form-help-text';
      helpText.textContent = field.helpText;
      formGroup.appendChild(helpText);
    }
    
    return formGroup;
  }
  
  /**
   * 创建表单
   * @param {Array<Object>} fields - 表单字段配置
   * @param {Object} options - 表单选项
   * @returns {HTMLElement} - 表单元素
   */
  function createForm(fields, options = {}) {
    const form = document.createElement('form');
    form.className = options.className || 'form';
    
    // 添加字段
    fields.forEach(field => {
      form.appendChild(createFormField(field));
    });
    
    // 添加按钮
    if (options.submitButton !== false) {
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'btn btn-primary';
      submitButton.textContent = options.submitText || '提交';
      
      // 添加取消按钮
      if (options.showCancel) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-outline';
        cancelButton.textContent = options.cancelText || '取消';
        
        if (options.onCancel) {
          cancelButton.addEventListener('click', options.onCancel);
        }
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'form-button-group';
        
        buttonGroup.appendChild(cancelButton);
        buttonGroup.appendChild(submitButton);
        form.appendChild(buttonGroup);
      } else {
        form.appendChild(submitButton);
      }
    }
    
    // 添加提交事件监听器
    if (options.onSubmit) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        // 收集表单数据
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
        
        // 调用提交回调
        options.onSubmit(data, form);
      });
    }
    
    return form;
  }
  
  /**
   * 创建数据表格
   * @param {Array<Object>} columns - 表格列配置
   * @param {Array<Object>} data - 表格数据
   * @param {Object} options - 表格选项
   * @returns {HTMLElement} - 表格元素
   */
  function createTable(columns, data, options = {}) {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    const table = document.createElement('table');
    table.className = options.className || 'table';
    
    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column.title;
      
      if (column.width) {
        th.style.width = column.width;
      }
      
      headerRow.appendChild(th);
    });
    
    // 添加操作列
    if (options.actions) {
      const actionsHeader = document.createElement('th');
      actionsHeader.textContent = options.actionsTitle || '操作';
      headerRow.appendChild(actionsHeader);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    
    data.forEach(item => {
      const row = document.createElement('tr');
      
      // 添加数据单元格
      columns.forEach(column => {
        const td = document.createElement('td');
        
        // 使用渲染函数或直接显示值
        if (column.render) {
          const content = column.render(item[column.dataIndex], item);
          
          if (typeof content === 'string') {
            td.innerHTML = content;
          } else if (content instanceof HTMLElement) {
            td.appendChild(content);
          }
        } else {
          td.textContent = item[column.dataIndex] || '';
        }
        
        row.appendChild(td);
      });
      
      // 添加操作单元格
      if (options.actions) {
        const actionsCell = document.createElement('td');
        actionsCell.className = 'table-actions';
        
        options.actions.forEach(action => {
          const button = document.createElement('button');
          button.className = `btn btn-${action.type || 'outline'} btn-sm`;
          
          if (action.icon) {
            button.innerHTML = `<i class="${action.icon}"></i>`;
            
            if (action.text) {
              button.innerHTML += ` ${action.text}`;
            }
          } else {
            button.textContent = action.text;
          }
          
          // 添加点击事件
          button.addEventListener('click', () => {
            action.onClick(item);
          });
          
          actionsCell.appendChild(button);
        });
        
        row.appendChild(actionsCell);
      }
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    // 添加空数据提示
    if (data.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      
      emptyCell.colSpan = columns.length + (options.actions ? 1 : 0);
      emptyCell.className = 'table-empty';
      emptyCell.textContent = options.emptyText || '暂无数据';
      
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    }
    
    return tableContainer;
  }
  
  // 公共API
  return {
    showModal,
    confirm,
    showToast,
    createFormField,
    createForm,
    createTable
  };
})(); 