import React, { useEffect, useRef, useState } from 'react';

// Coze 配置 - 从环境变量读取
const cozeConfig = {
  bot_id: import.meta.env.VITE_COZE_BOT_ID || '',
  token: import.meta.env.VITE_COZE_TOKEN || ''
};

// 验证必需的环境变量
if (!cozeConfig.bot_id || !cozeConfig.token) {
  console.error('❌ Coze 配置缺失！请设置以下环境变量：');
  console.error('   - VITE_COZE_BOT_ID');
  console.error('   - VITE_COZE_TOKEN');
  console.error('   本地开发：创建 .env.local 文件');
  console.error('   生产环境：在部署平台设置环境变量');
}

const CozeChat: React.FC = () => {
  // 使用 useRef 保存不需要触发重渲染的值
  const chatClientRef = useRef<any>(null);
  const cozeButtonRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);
  const processedButtonsRef = useRef<Set<HTMLElement>>(new Set());
  
  // 使用 useState 管理需要触发重渲染的状态
  const [isDragging, setIsDragging] = useState(false);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  /**
   * 加载 Coze SDK
   */
  const loadCozeSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 检查SDK是否已经加载
      if (window.CozeWebSDK && window.CozeWebSDK.WebChatClient) {
        console.log('✓ Coze SDK already loaded');
        resolve();
        return;
      }

      console.log('Loading Coze SDK...');
      const script = document.createElement('script');
      script.src = 'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js';
      script.async = true;
      
      script.onload = () => {
        // 等待SDK完全初始化
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒
        
        const checkSDK = () => {
          attempts++;
          if (window.CozeWebSDK && window.CozeWebSDK.WebChatClient) {
            console.log('✓ Coze SDK loaded successfully');
            resolve();
          } else if (attempts < maxAttempts) {
            setTimeout(checkSDK, 100);
          } else {
            reject(new Error('Coze SDK loaded but not initialized after 5 seconds'));
          }
        };
        checkSDK();
      };
      
      script.onerror = () => {
        console.error('✗ Failed to load Coze SDK script');
        reject(new Error('Failed to load Coze SDK'));
      };
      
      document.head.appendChild(script);
    });
  };

  /**
   * 保存按钮位置到 localStorage
   */
  const saveButtonPosition = (pos: { x: number; y: number }): void => {
    try {
      localStorage.setItem('cozeButtonPosition', JSON.stringify(pos));
    } catch (error) {
      console.warn('保存按钮位置失败:', error);
    }
  };

  /**
   * 判断是否是按钮元素（排除我们的容器）
   */
  const isButtonElement = (el: HTMLElement): boolean => {
    // 排除我们的容器元素
    if (el.classList.contains('coze-chat-container') || el.id === 'app' || el.id === 'root') {
      return false;
    }
    
    const className = el.className?.toString() || '';
    const id = el.id || '';
    const tagName = el.tagName.toLowerCase();
    
    // 检查是否包含 Coze logo 图片
    const hasCozeLogo = el.querySelector('img[src*="coze.cn"]') !== null || 
                        (tagName === 'img' && (el as HTMLImageElement).src?.includes('coze.cn'));
    
    // 检查是否是固定定位的按钮容器
    const style = window.getComputedStyle(el);
    const isFixed = style.position === 'fixed';
    const hasSize = el.offsetWidth > 0 && el.offsetHeight > 0;
    
    return (
      (tagName === 'button' || tagName === 'div' || tagName === 'img') &&
      (hasCozeLogo || 
       className.toLowerCase().includes('coze') ||
       className.toLowerCase().includes('chat') ||
       id.toLowerCase().includes('coze') ||
       id.toLowerCase().includes('chat') ||
       el.getAttribute('role') === 'button' ||
       (isFixed && hasSize && el.offsetWidth < 200 && el.offsetHeight < 200))
    );
  };

  /**
   * 将按钮转换为悬浮球样式
   */
  const transformToFloatingBall = (button: HTMLElement): void => {
    // 确保不是我们的容器元素
    if (button.classList.contains('coze-chat-container') || button.id === 'app' || button.id === 'root') {
      console.warn('尝试转换容器元素，跳过');
      return;
    }

    // 检查是否已经处理过
    if (processedButtonsRef.current.has(button)) {
      
      return;
    }

    

    // 标记为已处理
    processedButtonsRef.current.add(button);

    // 保存原始样式（如果存在）
    const originalStyle = button.getAttribute('data-original-style');
    if (!originalStyle) {
      button.setAttribute('data-original-style', button.style.cssText);
    }

    // 确保是固定定位
    const currentStyle = window.getComputedStyle(button);
    if (currentStyle.position !== 'fixed') {
      button.style.position = 'fixed';
    }

    // 应用悬浮球样式
    button.style.cssText += `
      width: 60px !important;
      height: 60px !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      cursor: grab !important;
      transition: transform 0.2s, box-shadow 0.2s !important;
      z-index: 9999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
      position: fixed !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    `;

    // 添加可见性控制
    if (!isVisible) {
      button.style.display = 'none';
    }

    // 添加悬停效果
    const handleMouseEnter = () => {
      if (!isDragging && isVisible) {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
      }
    };

    const handleMouseLeave = () => {
      if (!isDragging && isVisible) {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    
    // 保存事件处理器以便清理
    button.setAttribute('data-mouseenter-handler', 'true');
    button.setAttribute('data-mouseleave-handler', 'true');
  };

  /**
   * 设置拖拽处理函数（长按拖拽）
   */
  const setupDragHandlers = (button: HTMLElement): void => {
    // 确保不是我们的容器元素
    if (button.classList.contains('coze-chat-container') || button.id === 'app' || button.id === 'root') {
      console.warn('尝试为容器元素设置拖拽，跳过');
      return;
    }

    // 检查是否已经绑定过拖拽事件 - 如果已绑定，先移除旧的事件监听器
    if (button.getAttribute('data-drag-handlers') === 'true') {
      
      // 不返回，继续重新绑定以确保事件监听器正确
    }

    

    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    let hasMoved = false;
    const dragThreshold = 5; // 拖拽阈值，超过这个距离才认为是拖拽
    const longPressDelay = 300; // 长按延迟（毫秒）

    // 鼠标按下 - 开始长按检测
    const onMouseDown = (e: MouseEvent) => {
      // 使用最新的按钮引用，而不是闭包中的 button
      const currentButton = cozeButtonRef.current || button;
      
      
      
      if (!currentButton) {
        
        return;
      }
      
      e.stopPropagation();
      
      // 清除之前的长按计时器（如果存在）
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        
      }
      
      hasMoved = false;
      setIsDragging(false);
      isLongPressActiveRef.current = false;
      
      const rect = currentButton.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialX = rect.left;
      initialY = rect.top;

      // 开始长按计时器
      const timerId = setTimeout(() => {
        // 再次检查按钮引用
        let activeButton = cozeButtonRef.current || currentButton;
        
        
        
        // 如果按钮不在DOM中，尝试重新查找
        if (!activeButton || !document.body.contains(activeButton)) {
          
          
          // 尝试重新查找按钮
          const found = findAndTransformCozeButton();
          if (found && cozeButtonRef.current) {
            activeButton = cozeButtonRef.current;
            
          } else {
            
            return;
          }
        }
        
        if (!activeButton) {
          
          return;
        }
        
        isLongPressActiveRef.current = true;
        activeButton.style.cursor = 'grabbing';
        activeButton.style.transition = 'none';
        
        
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('mouseup', onMouseUp);
      }, longPressDelay);
      
      longPressTimerRef.current = timerId;
      
      
    };

    // 鼠标移动
    const onMouseMove = (e: MouseEvent) => {
      if (!isLongPressActiveRef.current) {
        return;
      }

      // 使用最新的按钮引用
      const currentButton = cozeButtonRef.current || button;
      if (!currentButton) {
        return;
      }

      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);

      // 如果移动距离超过阈值，开始拖拽
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        if (!isDragging) {
          setIsDragging(true);
          hasMoved = true;
          e.preventDefault();
          
        }

        const moveDeltaX = e.clientX - startX;
        const moveDeltaY = e.clientY - startY;

        let newX = initialX + moveDeltaX;
        let newY = initialY + moveDeltaY;

        // 边界限制
        const maxX = window.innerWidth - currentButton.offsetWidth;
        const maxY = window.innerHeight - currentButton.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        currentButton.style.left = `${newX}px`;
        currentButton.style.top = `${newY}px`;
        currentButton.style.right = 'auto';
        currentButton.style.bottom = 'auto';

        setButtonPos({ x: newX, y: newY });
      }
    };

    // 鼠标释放
    const onMouseUp = (e: MouseEvent) => {
      // 使用最新的按钮引用
      const currentButton = cozeButtonRef.current || button;
      
      
      
      // 清除长按计时器
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        
      }

      if (isDragging && hasMoved) {
        // 如果是拖拽，阻止点击事件
        e.preventDefault();
        e.stopPropagation();
      }

      setIsDragging(false);
      isLongPressActiveRef.current = false;
      const wasMoved = hasMoved;
      hasMoved = false;
      
      if (currentButton) {
        currentButton.style.cursor = 'grab';
        currentButton.style.transition = 'transform 0.2s, box-shadow 0.2s';
        currentButton.style.transform = 'scale(1)';

        // 如果发生了拖拽，保存位置（从按钮样式中读取最新位置）
        if (wasMoved) {
          const currentX = parseInt(currentButton.style.left) || 0;
          const currentY = parseInt(currentButton.style.top) || 0;
          saveButtonPosition({ x: currentX, y: currentY });
          
        }
      }

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      
    };

    // 触摸事件支持（移动端）- 长按拖拽
    let touchStartX = 0;
    let touchStartY = 0;
    let touchInitialX = 0;
    let touchInitialY = 0;
    let touchHasMoved = false;

    const onTouchStart = (e: TouchEvent) => {
      e.stopPropagation();
      
      touchHasMoved = false;
      setIsDragging(false);
      isLongPressActiveRef.current = false;

      const touch = e.touches[0];
      const rect = button.getBoundingClientRect();
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchInitialX = rect.left;
      touchInitialY = rect.top;

      // 开始长按计时器
      longPressTimerRef.current = setTimeout(() => {
        isLongPressActiveRef.current = true;
        button.style.transition = 'none';
        
        
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchend', onTouchEnd);
      }, longPressDelay);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isLongPressActiveRef.current) {
        return;
      }

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX);
      const deltaY = Math.abs(touch.clientY - touchStartY);

      // 如果移动距离超过阈值，开始拖拽
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        if (!isDragging) {
          setIsDragging(true);
          touchHasMoved = true;
          e.preventDefault();
        }

        const moveDeltaX = touch.clientX - touchStartX;
        const moveDeltaY = touch.clientY - touchStartY;

        let newX = touchInitialX + moveDeltaX;
        let newY = touchInitialY + moveDeltaY;

        const maxX = window.innerWidth - button.offsetWidth;
        const maxY = window.innerHeight - button.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        button.style.left = `${newX}px`;
        button.style.top = `${newY}px`;
        button.style.right = 'auto';
        button.style.bottom = 'auto';

        setButtonPos({ x: newX, y: newY });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      // 清除长按计时器
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (isDragging && touchHasMoved) {
        // 如果是拖拽，阻止点击事件
        e.preventDefault();
        e.stopPropagation();
      }

      setIsDragging(false);
      isLongPressActiveRef.current = false;
      const wasMoved = touchHasMoved;
      touchHasMoved = false;
      button.style.transition = 'transform 0.2s, box-shadow 0.2s';

      // 如果发生了拖拽，保存位置（从按钮样式中读取最新位置）
      if (wasMoved) {
        const currentX = parseInt(button.style.left) || 0;
        const currentY = parseInt(button.style.top) || 0;
        saveButtonPosition({ x: currentX, y: currentY });
      }

      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    // 绑定事件（确保事件监听器正确绑定）
    // 使用 once: false 确保事件监听器持续有效
    button.addEventListener('mousedown', onMouseDown, { passive: false, once: false });
    button.addEventListener('touchstart', onTouchStart, { passive: false, once: false });
    
    // 标记已绑定拖拽事件
    button.setAttribute('data-drag-handlers', 'true');
    button.setAttribute('data-coze-button-id', `coze-btn-${Date.now()}`);
    
    
  };

  /**
   * 切换悬浮球可见性
   */
  const toggleVisibility = (): void => {
    setIsVisible(prev => {
      const newVisible = !prev;
      if (cozeButtonRef.current) {
        cozeButtonRef.current.style.display = newVisible ? 'flex' : 'none';
        cozeButtonRef.current.style.visibility = newVisible ? 'visible' : 'hidden';
        
      }
      return newVisible;
    });
  };

  /**
   * 从 localStorage 恢复按钮位置
   */
  const restoreButtonPosition = (button: HTMLElement): void => {
    try {
      const buttonSize = 60; // 悬浮球固定大小
      const saved = localStorage.getItem('cozeButtonPosition');
      
      if (saved) {
        const pos = JSON.parse(saved) as { x: number; y: number };
        
        // 确保位置在窗口范围内
        const maxX = window.innerWidth - buttonSize;
        const maxY = window.innerHeight - buttonSize;
        
        const validX = Math.max(0, Math.min(pos.x, maxX));
        const validY = Math.max(0, Math.min(pos.y, maxY));
        
        button.style.left = `${validX}px`;
        button.style.top = `${validY}px`;
        button.style.right = 'auto';
        button.style.bottom = 'auto';
        setButtonPos({ x: validX, y: validY });
        console.log('✓ 恢复按钮位置:', { x: validX, y: validY });
      } else {
        // 默认位置：右下角
        const defaultX = window.innerWidth - buttonSize - 20;
        const defaultY = window.innerHeight - buttonSize - 20;
        button.style.left = `${defaultX}px`;
        button.style.top = `${defaultY}px`;
        button.style.right = 'auto';
        button.style.bottom = 'auto';
        setButtonPos({ x: defaultX, y: defaultY });
      }

      // 监听窗口大小变化，确保按钮始终在可视区域内
      const resizeHandler = () => {
        if (cozeButtonRef.current) {
          const buttonSize = 60;
          const currentX = parseInt(cozeButtonRef.current.style.left) || 0;
          const currentY = parseInt(cozeButtonRef.current.style.top) || 0;
          
          const maxX = window.innerWidth - buttonSize;
          const maxY = window.innerHeight - buttonSize;
          
          const validX = Math.max(0, Math.min(currentX, maxX));
          const validY = Math.max(0, Math.min(currentY, maxY));
          
          if (validX !== currentX || validY !== currentY) {
            cozeButtonRef.current.style.left = `${validX}px`;
            cozeButtonRef.current.style.top = `${validY}px`;
            setButtonPos({ x: validX, y: validY });
            saveButtonPosition({ x: validX, y: validY });
          }
        }
      };

      resizeHandlerRef.current = resizeHandler;
      window.addEventListener('resize', resizeHandler);
    } catch (error) {
      console.warn('恢复按钮位置失败:', error);
    }
  };

  /**
   * 查找并转换 Coze 按钮为可拖拽悬浮球
   * @returns 是否找到并转换了按钮
   */
  const findAndTransformCozeButton = (): boolean => {
    // 如果已经找到并处理过按钮，不再查找
    if (cozeButtonRef.current && processedButtonsRef.current.has(cozeButtonRef.current)) {
      
      return true;
    }

    // 尝试多种方式查找按钮
    const findAllButtons = (): HTMLElement[] => {
      const buttons: HTMLElement[] = [];
      
      // 方法1: 查找包含 Coze logo 图片的元素或其父容器
      const cozeLogoImgs = document.querySelectorAll('img[src*="coze.cn"][src*="836ebe4738d6a87f1d14"]');
      

      for (const cozeLogoImg of Array.from(cozeLogoImgs)) {
        const img = cozeLogoImg as HTMLElement;
        // 找到图片，查找其父容器（通常是可点击的按钮容器）
        let parent = img.parentElement;
        while (parent && parent !== document.body) {
          const style = window.getComputedStyle(parent);
          // 如果父元素是固定定位且可点击，就是我们要找的按钮
          if (style.position === 'fixed' && parent.offsetWidth > 0 && parent.offsetHeight > 0) {
            // 排除已处理的按钮
            if (!processedButtonsRef.current.has(parent)) {
              buttons.push(parent);
            }
            break;
          }
          parent = parent.parentElement;
        }
      }

      // 方法2: 查找固定定位且包含图片的元素（通常是按钮容器）
      const fixedElements = Array.from(document.querySelectorAll('*')).filter((el) => {
        // 排除我们的容器元素和已处理的按钮
        if (el.classList.contains('coze-chat-container') || el.id === 'app' || el.id === 'root') {
          return false;
        }
        
        // 排除已处理的按钮
        if (processedButtonsRef.current.has(el as HTMLElement)) {
          return false;
        }
        
        const style = window.getComputedStyle(el as HTMLElement);
        const isFixed = style.position === 'fixed';
        const hasSize = (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0;
        const hasImage = (el as HTMLElement).querySelector('img[src*="coze.cn"]') !== null;
        
        return isFixed && hasSize && hasImage;
      }) as HTMLElement[];

      buttons.push(...fixedElements);

      

      return buttons;
    };

    const allButtons = findAllButtons();
    
    if (allButtons.length === 0) {
      return false;
    }

    // 过滤出有效的按钮（有尺寸的）
    const validButtons = allButtons.filter(btn => {
      const hasSize = btn.offsetWidth > 0 && btn.offsetHeight > 0;
      const isVisible = window.getComputedStyle(btn).display !== 'none';
      return hasSize && isVisible && !processedButtonsRef.current.has(btn);
    });

    if (validButtons.length === 0) {
      
      return false;
    }

    // 只处理第一个有效按钮
    const mainButton = validButtons[0];
    
    // 先立即隐藏所有其他按钮，避免闪烁（但保留主按钮）
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      // 如果是主按钮，跳过隐藏
      if (button === mainButton) {
        continue;
      }
      button.style.display = 'none';
      button.style.visibility = 'hidden';
      button.style.pointerEvents = 'none';
      
    }
    
    // 检查主按钮是否已经处理过
    if (processedButtonsRef.current.has(mainButton)) {
      
      return true;
    }

    // 确保主按钮可见
    mainButton.style.display = 'flex';
    mainButton.style.visibility = 'visible';
    mainButton.style.pointerEvents = 'auto';

    

    cozeButtonRef.current = mainButton;
    transformToFloatingBall(mainButton);
    setupDragHandlers(mainButton);
    
    // 恢复保存的位置
    restoreButtonPosition(mainButton);
    return true;
  };

  /**
   * 使用 MutationObserver 监听按钮创建和变化
   */
  const setupButtonObserver = (): void => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new MutationObserver((mutations) => {
      // 检查当前按钮是否还在DOM中
      if (cozeButtonRef.current && !document.body.contains(cozeButtonRef.current)) {
        
        processedButtonsRef.current.delete(cozeButtonRef.current);
        cozeButtonRef.current = null;
        
        // 延迟重新查找，确保DOM完全更新
        setTimeout(() => {
          const found = findAndTransformCozeButton();
          if (found && cozeButtonRef.current) {
            cozeButtonRef.current.style.display = isVisible ? 'flex' : 'none';
            cozeButtonRef.current.style.visibility = isVisible ? 'visible' : 'hidden';
            
          }
        }, 200);
        return;
      }
      
      // 检查是否有新的按钮出现
      let shouldRecheck = false;
      
      for (const mutation of mutations) {
        // 检查新增的节点
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            
            // 检查是否是 Coze logo 图片
            if (el.tagName.toLowerCase() === 'img') {
              const img = el as HTMLImageElement;
              if (img.src?.includes('coze.cn') && img.src?.includes('836ebe4738d6a87f1d14')) {
                shouldRecheck = true;
                
                break;
              }
            }
            
            // 检查子元素中是否有 Coze logo 图片
            const cozeImg = el.querySelector('img[src*="coze.cn"][src*="836ebe4738d6a87f1d14"]');
            if (cozeImg) {
              shouldRecheck = true;
              
              break;
            }
          }
        }
        
        // 检查属性变化（可能是按钮被SDK重新创建或修改）
        if (mutation.type === 'attributes' && mutation.target) {
          const target = mutation.target as HTMLElement;
          if (target.querySelector && target.querySelector('img[src*="coze.cn"]')) {
            shouldRecheck = true;
            
          }
        }
      }
      
      // 如果检测到变化且当前没有按钮，重新查找和处理按钮
      if (shouldRecheck && !cozeButtonRef.current) {
        // 延迟一下，确保DOM完全更新
        setTimeout(() => {
          
          
          const found = findAndTransformCozeButton();
          if (found && cozeButtonRef.current) {
            // 确保按钮可见性同步
            if (cozeButtonRef.current) {
              cozeButtonRef.current.style.display = isVisible ? 'flex' : 'none';
              cozeButtonRef.current.style.visibility = isVisible ? 'visible' : 'hidden';
              
            }
          }
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    observerRef.current = observer;
    
    
  };

  /**
   * 初始化聊天
   */
  const initializeChat = async (): Promise<void> => {
    try {
      console.log('=== 开始初始化 Coze 聊天 ===');
      
      
      await loadCozeSDK();

      // 等待DOM完全准备好
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!window.CozeWebSDK || !window.CozeWebSDK.WebChatClient) {
        throw new Error('Coze Web SDK not loaded properly');
      }

      console.log('创建 WebChatClient 实例...');

      // 按照原始脚本的方式创建实例（不手动挂载）
      chatClientRef.current = new window.CozeWebSDK.WebChatClient({
        config: {
          bot_id: cozeConfig.bot_id,
        },
        componentProps: {
          title: 'SmartShop 智能助手',
        },
        auth: {
          type: 'token',
          token: cozeConfig.token,
          onRefreshToken: function () {
            return cozeConfig.token;
          }
        }
      });

      console.log('✓ WebChatClient 创建成功:', chatClientRef.current);
      console.log('可用方法:', Object.keys(chatClientRef.current || {}));

      // SDK会自动创建浮动按钮，不需要手动挂载
      // 等待SDK创建UI元素后，将其改造成可拖拽悬浮球
      // 使用多次尝试，因为SDK可能延迟创建按钮
      let attempts = 0;
      const maxAttempts = 10;
      const findButtonInterval = setInterval(() => {
        attempts++;
        console.log(`尝试查找 Coze 按钮 (${attempts}/${maxAttempts})...`);
        
        const found = findAndTransformCozeButton();
        if (found || attempts >= maxAttempts) {
          clearInterval(findButtonInterval);
          if (found) {
            // 找到按钮后，启动持续监听，以便在聊天窗口打开后重新绑定
            setupButtonObserver();
          } else {
            console.log('未找到按钮，启动 Observer 监听');
            setupButtonObserver();
          }
        }
      }, 500);
      
    } catch (error) {
      console.error('✗ 初始化 Coze 聊天失败:', error);
      
      // 显示错误提示
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'position:fixed;top:20px;left:20px;background:red;color:white;padding:20px;z-index:99999;border-radius:5px;';
      errorDiv.textContent = `Coze初始化失败: ${error instanceof Error ? error.message : String(error)}`;
      document.body.appendChild(errorDiv);
    }
  };

  /**
   * 清理资源
   */
  const destroyChat = (): void => {
    // 清理 Observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // 清理窗口大小变化监听器
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }

    // 清理长按计时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // 清理拖拽事件（如果需要）
    if (cozeButtonRef.current) {
      cozeButtonRef.current = null;
    }

    // 销毁聊天客户端
    if (chatClientRef.current && typeof chatClientRef.current.destroy === 'function') {
      chatClientRef.current.destroy();
      chatClientRef.current = null;
    }
  };

  // 组件挂载时初始化
  useEffect(() => {
    // 确保DOM完全加载后再初始化
    if (document.readyState === 'complete') {
      initializeChat();
    } else {
      window.addEventListener('load', initializeChat);
    }

    // 清理函数
    return () => {
      destroyChat();
      window.removeEventListener('load', initializeChat);
    };
  }, []);

  // 监听可见性变化
  useEffect(() => {
    if (cozeButtonRef.current) {
      cozeButtonRef.current.style.display = isVisible ? 'flex' : 'none';
    }
  }, [isVisible]);

  return (
    <div 
      className="coze-chat-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'static',
        pointerEvents: 'none'
      }}
    >
      {/* 隐藏/显示控制按钮 */}
      <button
        onClick={toggleVisibility}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
        title={isVisible ? '隐藏悬浮球' : '显示悬浮球'}
      >
        {isVisible ? '👁️' : '👁️‍🗨️'}
      </button>
      {/* Coze SDK会自动创建浮动按钮，不需要手动挂载 */}
    </div>
  );
};

export default CozeChat;
