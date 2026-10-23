importScripts("src/storage.js", "src/model.js");

const MENUS = {
  ROOT: "outline-root",
  CLIP_SELECTION: "outline-clip-selection",
  CLIP_PAGE: "outline-clip-page",
  NEW_NOTE: "outline-new-note"
};

function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENUS.ROOT,
      title: "Outline",
      contexts: ["page", "selection", "link", "image"]
    });
    chrome.contextMenus.create({
      id: MENUS.CLIP_SELECTION,
      parentId: MENUS.ROOT,
      title: "Clip selection",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: MENUS.CLIP_PAGE,
      parentId: MENUS.ROOT,
      title: "Save page as research",
      contexts: ["page", "selection", "link", "image"]
    });
    chrome.contextMenus.create({
      id: MENUS.NEW_NOTE,
      parentId: MENUS.ROOT,
      title: "Open a new note",
      contexts: ["page", "selection", "link", "image"]
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  OutlineStorage.ensure();
  buildMenus();
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "outline:toggle" }).catch(() => {});
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === MENUS.CLIP_SELECTION) {
    chrome.tabs.sendMessage(tab.id, {
      type: "outline:clip-selection",
      selectionText: info.selectionText || ""
    }).catch(() => {});
  }

  if (info.menuItemId === MENUS.CLIP_PAGE) {
    chrome.tabs.sendMessage(tab.id, { type: "outline:clip-page" }).catch(() => {});
  }

  if (info.menuItemId === MENUS.NEW_NOTE) {
    chrome.tabs.sendMessage(tab.id, { type: "outline:new-note" }).catch(() => {});
  }
});
