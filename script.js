// script.js

// --- 全局變數 ---
let rawPoetryText = ''; // 用於儲存從檔案讀取的原始詩歌文本
let highlightedMatches = []; // 用於內容內搜尋，儲存所有匹配的高亮元素
let currentMatchIndex = -1; // 當前活動高亮匹配的索引

// --- DOM 元素引用 ---
const poetryContentDiv = document.getElementById('poetryContent');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const navButtonsContainer = document.getElementById('navButtons');
const prevMatchButton = document.getElementById('prevMatchButton');
const nextMatchButton = document.getElementById('nextMatchButton');
const matchCountSpan = document.getElementById('matchCount');

// --- 輔助函數 ---

/**
 * 函數：更新匹配數量顯示
 * @param {number} current - 當前匹配項的索引 (從1開始)
 * @param {number} total - 總匹配項數量
 */
function updateMatchCountDisplay(current, total) {
    if (matchCountSpan) {
        if (total > 0) {
            matchCountSpan.textContent = `${current}/${total}`;
            navButtonsContainer.style.display = 'flex'; // 顯示導航按鈕容器
        } else {
            matchCountSpan.textContent = '0/0';
            navButtonsContainer.style.display = 'none'; // 隱藏導航按鈕容器
        }
    }
}

/**
 * 函數：從當前顯示的文本中移除所有高亮顯示
 */
function removeHighlights() {
    const highlightedElements = poetryContentDiv.querySelectorAll('.highlight');
    highlightedElements.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
            // 用 span 裡面的文本替換整個 span 元素
            span.replaceWith(document.createTextNode(span.textContent));
        }
    });
    // 合併相鄰的文本節點，防止因為替換導致文本被分割成多個節點
    poetryContentDiv.normalize();

    highlightedMatches = []; // 清空匹配列表
    currentMatchIndex = -1; // 重置索引
    updateMatchCountDisplay(0, 0); // 清空匹配數量顯示
}

/**
 * 函數：執行內容內搜尋並高亮匹配項 (性能優化版)
 */
function performInPageSearch() {
    const searchTerm = searchInput.value.trim();

    // 每次新搜尋前先移除舊的高亮
    removeHighlights();

    if (!searchTerm) {
        return; // 搜尋詞為空，不做任何操作
    }

    if (!rawPoetryText) {
        poetryContentDiv.textContent = '詩歌內容尚未載入。';
        return;
    }

    const searchRegex = new RegExp(searchTerm, 'gi'); // 全局、不區分大小寫搜尋

    // 遍歷 poetryContentDiv 的所有子節點，查找文本節點進行替換
    // 我們需要一個函數來遞歸遍歷所有子節點
    function highlightNode(node) {
        if (node.nodeType === Node.TEXT_NODE) { // 如果是文本節點
            const text = node.nodeValue;
            const matches = [...text.matchAll(searchRegex)]; // 找到所有匹配

            if (matches.length > 0) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;

                matches.forEach(match => {
                    // 添加匹配前的文本
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                    }
                    // 添加高亮後的文本
                    const span = document.createElement('span');
                    span.className = 'highlight';
                    span.textContent = match[0];
                    fragment.appendChild(span);
                    highlightedMatches.push(span); // 收集高亮元素
                    lastIndex = match.index + match[0].length;
                });

                // 添加匹配後的剩餘文本
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                }

                node.parentNode.replaceChild(fragment, node); // 替換原始文本節點
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') { // 如果是元素節點，且不是script/style標籤
            // 避免遞歸到已經被高亮的元素內部，或者避免無限遞歸
            if (!node.classList.contains('highlight') && node.children.length > 0) {
                // 克隆子節點列表，因為在遍歷過程中會修改 DOM
                const childNodes = Array.from(node.childNodes);
                childNodes.forEach(highlightNode);
            }
        }
    }

    // 開始遍歷主內容區
    highlightNode(poetryContentDiv);


    currentMatchIndex = -1; // 重置索引

    if (highlightedMatches.length > 0) {
        // 滾動到第一個匹配項
        navigateToNextMatch();
    } else {
        alert(`找不到與「${searchTerm}」相關的內容。`);
        updateMatchCountDisplay(0, 0); // 沒有匹配項
    }
}

/**
 * 導航到下一個匹配項
 */
function navigateToNextMatch() {
    if (highlightedMatches.length === 0) return;

    // 移除當前活動匹配的高亮樣式
    if (currentMatchIndex !== -1 && highlightedMatches[currentMatchIndex]) {
        highlightedMatches[currentMatchIndex].classList.remove('active-highlight');
    }

    currentMatchIndex = (currentMatchIndex + 1) % highlightedMatches.length;

    // 確保元素仍然存在
    if (highlightedMatches[currentMatchIndex]) {
        highlightedMatches[currentMatchIndex].classList.add('active-highlight'); // 添加活動樣式
        highlightedMatches[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' }); // 滾動到視圖中央
    }

    updateMatchCountDisplay(currentMatchIndex + 1, highlightedMatches.length);
}

/**
 * 導航到上一個匹配項
 */
function navigateToPrevMatch() {
    if (highlightedMatches.length === 0) return;

    // 移除當前活動匹配的高亮樣式
    if (currentMatchIndex !== -1 && highlightedMatches[currentMatchIndex]) {
        highlightedMatches[currentMatchIndex].classList.remove('active-highlight');
    }

    currentMatchIndex = (currentMatchIndex - 1 + highlightedMatches.length) % highlightedMatches.length;

    // 確保元素仍然存在
    if (highlightedMatches[currentMatchIndex]) {
        highlightedMatches[currentMatchIndex].classList.add('active-highlight'); // 添加活動樣式
        highlightedMatches[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' }); // 滾動到視圖中央
    }

    updateMatchCountDisplay(currentMatchIndex + 1, highlightedMatches.length);
}

/**
 * 函數：從文本檔案中獲取詩歌內容並顯示
 */
async function fetchAndDisplayPoetry() {
    try {
        const response = await fetch('GODFamilyHymnal.txt'); // <--- 請確保這裡的文件名和您的txt文件一致
        if (!response.ok) {
            throw new Error(`無法載入詩歌檔案: ${response.statusText}`);
        }
        rawPoetryText = await response.text();
        console.log('詩歌檔案載入成功！');
        // 首次載入時，直接將原始文本內容（處理換行符）顯示到頁面上
        poetryContentDiv.innerHTML = rawPoetryText.replace(/\n/g, '<br>');

        // 首次載入時清空搜尋輸入框
        searchInput.value = '';

    } catch (error) {
        console.error('載入詩歌檔案時發生錯誤:', error);
        poetryContentDiv.innerHTML = '<p style="color: red; text-align: center;">無法載入詩歌內容，請檢查檔案是否存在並確認路徑。</p>';
    }
}

// --- 事件監聽器 ---

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayPoetry(); // 在 DOM 載入後立即開始載入詩歌文本

    // 搜尋輸入框的鍵盤事件 (Enter 鍵)
    if (searchInput) {
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                performInPageSearch();
            }
        });
    }

    // 搜尋按鈕的點擊事件
    if (searchButton) {
        searchButton.addEventListener('click', performInPageSearch);
    }

    // 「上一個」和「下一個」按鈕的點擊事件
    if (prevMatchButton) {
        prevMatchButton.addEventListener('click', navigateToPrevMatch);
    }
    if (nextMatchButton) {
        nextMatchButton.addEventListener('click', navigateToNextMatch);
    }
});
