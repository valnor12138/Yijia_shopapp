<template>
  <div class="coze-chat-container">
    <!-- Coze SDK会自动创建浮动按钮，不需要手动挂载 -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

// Coze Web SDK 已在 env.d.ts 中声明

// Coze 配置
const cozeConfig = {
  bot_id: '7587693887050203162', // 按照原始脚本使用 bot_id
  token: 'pat_KZG9X9M0SPp1H9Lx2UUdJLJqu7JGW7Xd97dJvA3GVUJORDsVKvULePowZF2PH9N1'
}

let chatClient: any = null
let cozeButton: HTMLElement | null = null
let observer: MutationObserver | null = null
let resizeHandler: (() => void) | null = null
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const buttonPos = ref({ x: 0, y: 0 })

const loadCozeSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查SDK是否已经加载
    if (window.CozeWebSDK && window.CozeWebSDK.WebChatClient) {
      console.log('✓ Coze SDK already loaded')
      resolve()
      return
    }

    console.log('Loading Coze SDK...')
    const script = document.createElement('script')
    script.src = 'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js'
    script.async = true
    
    script.onload = () => {
      // 等待SDK完全初始化
      let attempts = 0
      const maxAttempts = 50 // 最多等待5秒
      
      const checkSDK = () => {
        attempts++
        if (window.CozeWebSDK && window.CozeWebSDK.WebChatClient) {
          console.log('✓ Coze SDK loaded successfully')
          resolve()
        } else if (attempts < maxAttempts) {
          setTimeout(checkSDK, 100)
        } else {
          reject(new Error('Coze SDK loaded but not initialized after 5 seconds'))
        }
      }
      checkSDK()
    }
    
    script.onerror = () => {
      console.error('✗ Failed to load Coze SDK script')
      reject(new Error('Failed to load Coze SDK'))
    }
    
    document.head.appendChild(script)
  })
}

const initializeChat = async (): Promise<void> => {
  try {
    console.log('=== 开始初始化 Coze 聊天 ===')
    
    await loadCozeSDK()

    // 等待DOM完全准备好
    await new Promise(resolve => setTimeout(resolve, 200))

    if (!window.CozeWebSDK || !window.CozeWebSDK.WebChatClient) {
      throw new Error('Coze Web SDK not loaded properly')
    }

    console.log('创建 WebChatClient 实例...')

    // 按照原始脚本的方式创建实例（不手动挂载）
    chatClient = new window.CozeWebSDK.WebChatClient({
      config: {
        bot_id: cozeConfig.bot_id, // 按照原始脚本使用 bot_id
      },
      componentProps: {
        title: 'SmartShop 智能助手',
      },
      auth: {
        type: 'token',
        token: cozeConfig.token,
        onRefreshToken: function () {
          return cozeConfig.token
        }
      }
    })

    console.log('✓ WebChatClient 创建成功:', chatClient)
    console.log('可用方法:', Object.keys(chatClient || {}))

    // SDK会自动创建浮动按钮，不需要手动挂载
    // 等待SDK创建UI元素后，将其改造成可拖拽悬浮球
    // 使用多次尝试，因为SDK可能延迟创建按钮
    let attempts = 0
    const maxAttempts = 10
    const findButtonInterval = setInterval(() => {
      attempts++
      console.log(`尝试查找 Coze 按钮 (${attempts}/${maxAttempts})...`)
      
      const found = findAndTransformCozeButton()
      if (found || attempts >= maxAttempts) {
        clearInterval(findButtonInterval)
        if (!found) {
          console.log('未找到按钮，启动 Observer 监听')
          setupButtonObserver()
        }
      }
    }, 500)
    
  } catch (error) {
    console.error('✗ 初始化 Coze 聊天失败:', error)
    // 显示错误提示
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = 'position:fixed;top:20px;left:20px;background:red;color:white;padding:20px;z-index:99999;border-radius:5px;'
    errorDiv.textContent = `Coze初始化失败: ${error instanceof Error ? error.message : String(error)}`
    document.body.appendChild(errorDiv)
  }
}

/**
 * 查找并转换 Coze 按钮为可拖拽悬浮球
 * @returns 是否找到并转换了按钮
 */
const findAndTransformCozeButton = (): boolean => {
  // 尝试多种方式查找按钮
  const findButton = (): HTMLElement | null => {
    // 方法1: 查找包含 Coze logo 图片的元素或其父容器
    const cozeLogoImg = document.querySelector('img[src*="coze.cn"][src*="logo"], img[src*="coze.cn"][alt*="logo"], img[src*="836ebe4738d6a87f1d14"]') as HTMLElement
    if (cozeLogoImg) {
      // 找到图片，查找其父容器（通常是可点击的按钮容器）
      let parent = cozeLogoImg.parentElement
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent)
        // 如果父元素是固定定位且可点击，就是我们要找的按钮
        if (style.position === 'fixed' && parent.offsetWidth > 0 && parent.offsetHeight > 0) {
          console.log('✓ 通过 logo 图片找到 Coze 按钮容器')
          return parent
        }
        parent = parent.parentElement
      }
      // 如果没找到固定定位的父容器，返回图片的直接父元素
      if (cozeLogoImg.parentElement) {
        console.log('✓ 通过 logo 图片找到 Coze 按钮（直接父元素）')
        return cozeLogoImg.parentElement
      }
    }

    // 方法2: 查找固定定位且包含图片的元素（通常是按钮容器）
    const fixedElements = Array.from(document.querySelectorAll('*')).filter((el) => {
      // 排除我们的容器元素
      if (el.classList.contains('coze-chat-container') || el.id === 'app') {
        return false
      }
      
      const style = window.getComputedStyle(el as HTMLElement)
      const isFixed = style.position === 'fixed'
      const hasSize = (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0
      const hasImage = (el as HTMLElement).querySelector('img[src*="coze.cn"]') !== null
      
      return isFixed && hasSize && hasImage
    }) as HTMLElement[]

    if (fixedElements.length > 0) {
      console.log('✓ 通过固定定位元素找到 Coze 按钮')
      return fixedElements[0]
    }

    // 方法3: 查找固定定位在右下角的元素（排除我们的容器）
    const fixedBottomRight = Array.from(document.querySelectorAll('*')).filter((el) => {
      // 排除我们的容器元素
      if (el.classList.contains('coze-chat-container') || el.id === 'app') {
        return false
      }
      
      const style = window.getComputedStyle(el as HTMLElement)
      const isFixed = style.position === 'fixed'
      const bottom = parseInt(style.bottom) || 0
      const right = parseInt(style.right) || 0
      const hasSize = (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0
      
      return isFixed && (bottom > 0 || right > 0) && hasSize && 
             (el as HTMLElement).offsetWidth < 200 && (el as HTMLElement).offsetHeight < 200 // 按钮通常不会太大
    }) as HTMLElement[]

    if (fixedBottomRight.length > 0) {
      console.log('✓ 通过右下角固定定位找到可能的 Coze 按钮')
      return fixedBottomRight[0]
    }

    return null
  }

  const button = findButton()
  
  if (button) {
    console.log('✓ 找到 Coze 按钮，开始转换为悬浮球', button)
    cozeButton = button
    transformToFloatingBall(button)
    setupDragHandlers(button)
    
    // 恢复保存的位置
    restoreButtonPosition(button)
    return true
  }
  
  return false
}

/**
 * 判断是否是按钮元素（排除我们的容器）
 */
const isButtonElement = (el: HTMLElement): boolean => {
  // 排除我们的容器元素
  if (el.classList.contains('coze-chat-container') || el.id === 'app') {
    return false
  }
  
  const className = el.className?.toString() || ''
  const id = el.id || ''
  const tagName = el.tagName.toLowerCase()
  
  // 检查是否包含 Coze logo 图片
  const hasCozeLogo = el.querySelector('img[src*="coze.cn"]') !== null || 
                      (tagName === 'img' && (el as HTMLImageElement).src?.includes('coze.cn'))
  
  // 检查是否是固定定位的按钮容器
  const style = window.getComputedStyle(el)
  const isFixed = style.position === 'fixed'
  const hasSize = el.offsetWidth > 0 && el.offsetHeight > 0
  
  return (
    (tagName === 'button' || tagName === 'div' || tagName === 'img') &&
    (hasCozeLogo || 
     className.toLowerCase().includes('coze') ||
     className.toLowerCase().includes('chat') ||
     id.toLowerCase().includes('coze') ||
     id.toLowerCase().includes('chat') ||
     el.getAttribute('role') === 'button' ||
     (isFixed && hasSize && el.offsetWidth < 200 && el.offsetHeight < 200))
  )
}

/**
 * 使用 MutationObserver 监听按钮创建
 */
const setupButtonObserver = (): void => {
  if (observer) {
    observer.disconnect()
  }

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement
          
          // 检查是否是 Coze logo 图片
          if (el.tagName.toLowerCase() === 'img') {
            const img = el as HTMLImageElement
            if (img.src?.includes('coze.cn') && img.src?.includes('836ebe4738d6a87f1d14')) {
              // 找到图片，查找其父容器
              let parent = img.parentElement
              while (parent && parent !== document.body) {
                const style = window.getComputedStyle(parent)
                if (style.position === 'fixed' && parent.offsetWidth > 0 && parent.offsetHeight > 0) {
                  console.log('✓ 通过 Observer 找到 Coze 按钮（通过图片）')
                  cozeButton = parent
                  transformToFloatingBall(parent)
                  setupDragHandlers(parent)
                  restoreButtonPosition(parent)
                  observer?.disconnect()
                  return
                }
                parent = parent.parentElement
              }
            }
          }
          
          // 检查元素本身是否是按钮
          if (isButtonElement(el)) {
            console.log('✓ 通过 Observer 找到 Coze 按钮')
            cozeButton = el
            transformToFloatingBall(el)
            setupDragHandlers(el)
            restoreButtonPosition(el)
            observer?.disconnect()
            return
          }
          
          // 检查子元素中是否有 Coze logo 图片
          const cozeImg = el.querySelector('img[src*="coze.cn"][src*="836ebe4738d6a87f1d14"]') as HTMLElement
          if (cozeImg) {
            let parent = cozeImg.parentElement
            while (parent && parent !== document.body) {
              const style = window.getComputedStyle(parent)
              if (style.position === 'fixed' && parent.offsetWidth > 0 && parent.offsetHeight > 0) {
                console.log('✓ 通过 Observer 找到 Coze 按钮（通过子元素图片）')
                cozeButton = parent
                transformToFloatingBall(parent)
                setupDragHandlers(parent)
                restoreButtonPosition(parent)
                observer?.disconnect()
                return
              }
              parent = parent.parentElement
            }
          }
        }
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // 每500ms也尝试直接查找一次（作为备用）
  let attempts = 0
  const maxAttempts = 20 // 10秒
  const checkInterval = setInterval(() => {
    if (cozeButton) {
      clearInterval(checkInterval)
      if (observer) {
        observer.disconnect()
        observer = null
      }
      return
    }
    
    attempts++
    // 直接查找按钮
    const cozeLogoImg = document.querySelector('img[src*="coze.cn"][src*="836ebe4738d6a87f1d14"]') as HTMLElement
    if (cozeLogoImg) {
      let parent = cozeLogoImg.parentElement
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent)
        if (style.position === 'fixed' && parent.offsetWidth > 0 && parent.offsetHeight > 0) {
          console.log('✓ 通过定时器找到 Coze 按钮')
          cozeButton = parent
          transformToFloatingBall(parent)
          setupDragHandlers(parent)
          restoreButtonPosition(parent)
          clearInterval(checkInterval)
          if (observer) {
            observer.disconnect()
            observer = null
          }
          return
        }
        parent = parent.parentElement
      }
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(checkInterval)
    }
  }, 500)

  // 10秒后停止观察
  setTimeout(() => {
    clearInterval(checkInterval)
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }, 10000)
}

/**
 * 将按钮转换为悬浮球样式
 */
const transformToFloatingBall = (button: HTMLElement): void => {
  // 确保不是我们的容器元素
  if (button.classList.contains('coze-chat-container') || button.id === 'app') {
    console.warn('尝试转换容器元素，跳过')
    return
  }

  // 保存原始样式（如果存在）
  const originalStyle = button.getAttribute('data-original-style')
  if (!originalStyle) {
    button.setAttribute('data-original-style', button.style.cssText)
  }

  // 确保是固定定位
  const currentStyle = window.getComputedStyle(button)
  if (currentStyle.position !== 'fixed') {
    button.style.position = 'fixed'
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
  `

  // 添加悬停效果
  const handleMouseEnter = () => {
    if (!isDragging.value) {
      button.style.transform = 'scale(1.1)'
      button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
    }
  }

  const handleMouseLeave = () => {
    if (!isDragging.value) {
      button.style.transform = 'scale(1)'
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
    }
  }

  button.addEventListener('mouseenter', handleMouseEnter)
  button.addEventListener('mouseleave', handleMouseLeave)
  
  // 保存事件处理器以便清理
  button.setAttribute('data-mouseenter-handler', 'true')
  button.setAttribute('data-mouseleave-handler', 'true')
}

/**
 * 设置拖拽处理函数
 */
const setupDragHandlers = (button: HTMLElement): void => {
  // 确保不是我们的容器元素
  if (button.classList.contains('coze-chat-container') || button.id === 'app') {
    console.warn('尝试为容器元素设置拖拽，跳过')
    return
  }

  let startX = 0
  let startY = 0
  let initialX = 0
  let initialY = 0
  let hasMoved = false
  let dragThreshold = 5 // 拖拽阈值，超过这个距离才认为是拖拽

  // 鼠标按下
  const onMouseDown = (e: MouseEvent) => {
    // 不阻止默认行为，让点击事件也能正常工作
    e.stopPropagation()
    
    hasMoved = false
    isDragging.value = false
    button.style.cursor = 'grabbing'
    button.style.transition = 'none'
    
    const rect = button.getBoundingClientRect()
    startX = e.clientX
    startY = e.clientY
    initialX = rect.left
    initialY = rect.top

    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseup', onMouseUp)
  }

  // 鼠标移动
  const onMouseMove = (e: MouseEvent) => {
    const deltaX = Math.abs(e.clientX - startX)
    const deltaY = Math.abs(e.clientY - startY)

    // 如果移动距离超过阈值，开始拖拽
    if (deltaX > dragThreshold || deltaY > dragThreshold) {
      if (!isDragging.value) {
        isDragging.value = true
        hasMoved = true
        e.preventDefault() // 开始拖拽后阻止默认行为
      }

      const moveDeltaX = e.clientX - startX
      const moveDeltaY = e.clientY - startY

      let newX = initialX + moveDeltaX
      let newY = initialY + moveDeltaY

      // 边界限制
      const maxX = window.innerWidth - button.offsetWidth
      const maxY = window.innerHeight - button.offsetHeight

      newX = Math.max(0, Math.min(newX, maxX))
      newY = Math.max(0, Math.min(newY, maxY))

      button.style.left = `${newX}px`
      button.style.top = `${newY}px`
      button.style.right = 'auto'
      button.style.bottom = 'auto'

      buttonPos.value = { x: newX, y: newY }
    }
  }

  // 鼠标释放
  const onMouseUp = (e: MouseEvent) => {
    if (isDragging.value && hasMoved) {
      // 如果是拖拽，阻止点击事件
      e.preventDefault()
      e.stopPropagation()
    }

    isDragging.value = false
    hasMoved = false
    button.style.cursor = 'grab'
    button.style.transition = 'transform 0.2s, box-shadow 0.2s'
    button.style.transform = 'scale(1)'

    // 如果发生了拖拽，保存位置
    if (hasMoved) {
      saveButtonPosition(buttonPos.value)
    }

    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  // 触摸事件支持（移动端）
  let touchStartX = 0
  let touchStartY = 0
  let touchInitialX = 0
  let touchInitialY = 0
  let touchHasMoved = false

  const onTouchStart = (e: TouchEvent) => {
    e.stopPropagation()
    
    touchHasMoved = false
    isDragging.value = false
    button.style.transition = 'none'

    const touch = e.touches[0]
    const rect = button.getBoundingClientRect()
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchInitialX = rect.left
    touchInitialY = rect.top

    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)
  }

  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartX)
    const deltaY = Math.abs(touch.clientY - touchStartY)

    // 如果移动距离超过阈值，开始拖拽
    if (deltaX > dragThreshold || deltaY > dragThreshold) {
      if (!isDragging.value) {
        isDragging.value = true
        touchHasMoved = true
        e.preventDefault() // 开始拖拽后阻止默认行为
      }

      const moveDeltaX = touch.clientX - touchStartX
      const moveDeltaY = touch.clientY - touchStartY

      let newX = touchInitialX + moveDeltaX
      let newY = touchInitialY + moveDeltaY

      const maxX = window.innerWidth - button.offsetWidth
      const maxY = window.innerHeight - button.offsetHeight

      newX = Math.max(0, Math.min(newX, maxX))
      newY = Math.max(0, Math.min(newY, maxY))

      button.style.left = `${newX}px`
      button.style.top = `${newY}px`
      button.style.right = 'auto'
      button.style.bottom = 'auto'

      buttonPos.value = { x: newX, y: newY }
    }
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (isDragging.value && touchHasMoved) {
      // 如果是拖拽，阻止点击事件
      e.preventDefault()
      e.stopPropagation()
    }

    isDragging.value = false
    touchHasMoved = false
    button.style.transition = 'transform 0.2s, box-shadow 0.2s'

    // 如果发生了拖拽，保存位置
    if (touchHasMoved) {
      saveButtonPosition(buttonPos.value)
    }

    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
  }

  // 绑定事件
  button.addEventListener('mousedown', onMouseDown, { passive: false })
  button.addEventListener('touchstart', onTouchStart, { passive: false })
  
  // 标记已绑定拖拽事件
  button.setAttribute('data-drag-handlers', 'true')
}

/**
 * 保存按钮位置到 localStorage
 */
const saveButtonPosition = (pos: { x: number; y: number }): void => {
  try {
    localStorage.setItem('cozeButtonPosition', JSON.stringify(pos))
  } catch (error) {
    console.warn('保存按钮位置失败:', error)
  }
}

/**
 * 从 localStorage 恢复按钮位置
 */
const restoreButtonPosition = (button: HTMLElement): void => {
  try {
    const buttonSize = 60 // 悬浮球固定大小
    const saved = localStorage.getItem('cozeButtonPosition')
    
    if (saved) {
      const pos = JSON.parse(saved) as { x: number; y: number }
      
      // 确保位置在窗口范围内
      const maxX = window.innerWidth - buttonSize
      const maxY = window.innerHeight - buttonSize
      
      const validX = Math.max(0, Math.min(pos.x, maxX))
      const validY = Math.max(0, Math.min(pos.y, maxY))
      
      button.style.left = `${validX}px`
      button.style.top = `${validY}px`
      button.style.right = 'auto'
      button.style.bottom = 'auto'
      buttonPos.value = { x: validX, y: validY }
      console.log('✓ 恢复按钮位置:', { x: validX, y: validY })
    } else {
      // 默认位置：右下角
      const defaultX = window.innerWidth - buttonSize - 20
      const defaultY = window.innerHeight - buttonSize - 20
      button.style.left = `${defaultX}px`
      button.style.top = `${defaultY}px`
      button.style.right = 'auto'
      button.style.bottom = 'auto'
      buttonPos.value = { x: defaultX, y: defaultY }
    }

    // 监听窗口大小变化，确保按钮始终在可视区域内
    resizeHandler = () => {
      if (cozeButton) {
        const buttonSize = 60
        const currentX = parseInt(cozeButton.style.left) || 0
        const currentY = parseInt(cozeButton.style.top) || 0
        
        const maxX = window.innerWidth - buttonSize
        const maxY = window.innerHeight - buttonSize
        
        const validX = Math.max(0, Math.min(currentX, maxX))
        const validY = Math.max(0, Math.min(currentY, maxY))
        
        if (validX !== currentX || validY !== currentY) {
          cozeButton.style.left = `${validX}px`
          cozeButton.style.top = `${validY}px`
          buttonPos.value = { x: validX, y: validY }
          saveButtonPosition(buttonPos.value)
        }
      }
    }

    window.addEventListener('resize', resizeHandler)
  } catch (error) {
    console.warn('恢复按钮位置失败:', error)
  }
}

const autoOpenChat = (): void => {
  try {
    console.log('尝试自动打开聊天窗口...')
    
    // 方法1: 尝试直接调用open方法
    if (chatClient && typeof chatClient.open === 'function') {
      console.log('调用 chatClient.open()')
      chatClient.open()
      return
    }
    
    // 方法2: 尝试调用show方法
    if (chatClient && typeof chatClient.show === 'function') {
      console.log('调用 chatClient.show()')
      chatClient.show()
      return
    }
    
    // 方法3: 查找并点击浮动按钮
    const findAndClickButton = (): boolean => {
      // 查找所有固定定位的元素（通常是浮动按钮）
      const fixedElements = Array.from(document.querySelectorAll('*')).filter((el) => {
        const style = window.getComputedStyle(el as HTMLElement)
        return style.position === 'fixed' && 
               (parseInt(style.bottom) > 0 || parseInt(style.right) > 0)
      }) as HTMLElement[]
      
      for (const el of fixedElements) {
        const className = el.className?.toString() || ''
        const id = el.id || ''
        
        // 检查是否包含coze相关关键词
        if (className.toLowerCase().includes('coze') || 
            id.toLowerCase().includes('coze') ||
            className.toLowerCase().includes('chat') ||
            id.toLowerCase().includes('chat')) {
          console.log('找到可能的按钮，尝试点击:', { className, id })
          
          // 尝试多种点击方式
          if (el.click) {
            el.click()
          } else if (el.onclick) {
            el.onclick(new MouseEvent('click'))
          } else {
            // 创建并分发点击事件
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            })
            el.dispatchEvent(clickEvent)
          }
          
          return true
        }
      }
      
      return false
    }
    
    if (!findAndClickButton()) {
      console.warn('未找到浮动按钮，SDK可能还在初始化中')
    }
  } catch (err) {
    console.warn('自动打开失败:', err)
  }
}

const destroyChat = (): void => {
  // 清理 Observer
  if (observer) {
    observer.disconnect()
    observer = null
  }

  // 清理窗口大小变化监听器
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }

  // 清理拖拽事件（如果需要）
  if (cozeButton) {
    cozeButton = null
  }

  // 销毁聊天客户端
  if (chatClient && typeof chatClient.destroy === 'function') {
    chatClient.destroy()
    chatClient = null
  }
}

onMounted(() => {
  // 确保DOM完全加载后再初始化
  if (document.readyState === 'complete') {
    initializeChat()
  } else {
    window.addEventListener('load', initializeChat)
  }
})

onUnmounted(() => {
  destroyChat()
})
</script>

<style scoped>
.coze-chat-container {
  /* 最小样式，不干扰SDK */
  width: 100%;
  height: 100%;
  position: static !important;
  /* 确保容器不会被误认为是按钮 */
  pointer-events: none !important;
}

.coze-chat-container * {
  pointer-events: auto;
}
</style>

<style>
/* 确保Coze创建的浮动按钮可见且可点击 */
[class*="coze"],
[id*="coze"] {
  pointer-events: auto !important;
  visibility: visible !important;
}

/* 悬浮球基础样式 */
.coze-floating-ball {
  position: fixed !important;
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
  user-select: none !important;
  -webkit-user-select: none !important;
}

.coze-floating-ball:active {
  cursor: grabbing !important;
}

/* 确保按钮内容居中 */
.coze-floating-ball > * {
  margin: auto !important;
}
</style>