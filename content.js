(function () {
    // Utility functions for logging and alerts
    const Utils = {
        log: (message) => console.log(`${message} - ${new Date()}`),
        error: (message) => console.error(`${message} - ${new Date()}`),
        logAndAlert: (message) => { Utils.log(message); alert(message); }
    };

    // State management object
    const WebPlugin = { isLoggedIn: false, isChatboxOpen: false, currentChatTitle: null };

    // Initialize the script
    function init() {
        new MutationObserver(handleMutations).observe(document.body, { childList: true, subtree: true });
    }

    function handleMutations(_, observer) {
        if (!WebPlugin.isLoggedIn && !checkLoginStatus()) return;
        observer.disconnect();
        assignChatItemClickHandlers();
    }

    function assignChatItemClickHandlers() {
        const chatItems = document.querySelectorAll("#side [role=listitem]");
        if (!chatItems.length) return Utils.error("Chats not found");

        Utils.log("Chats found!");
        chatItems.forEach((item) => item.addEventListener('click', handleChatClick));
    }

    function handleChatClick() {
        Utils.log("Chat clicked");
        WebPlugin.isChatboxOpen = false;
        WebPlugin.currentChatTitle = null;
        observeChatbox().then(processChat);
    }

    function checkLoginStatus() {
        const isNotLoggedIn = ['canvas[aria-label="Scan me!"]', 'div[data-testid="qr-code"]', 'div[data-testid="intro-text"]', 'div[class*="landing-wrapper"]']
            .some((selector) => document.querySelector(selector));
        if (isNotLoggedIn) {
            Utils.log('You are not logged in to WhatsApp Web. Please log in first.');
            return false;
        }
        if (!document.getElementById("side")) {
            Utils.log("Loading chats...");
            return false;
        }

        WebPlugin.isLoggedIn = true;
        Utils.log('You are logged in to WhatsApp Web.');
        return true;
    }

    function observeChatbox() {
        return new Promise((resolve) => {
            const chatObserver = new MutationObserver(() => {
                const mainEle = document.getElementById("main");
                if (!mainEle) {
                    Utils.logAndAlert("Chat box not opened yet - main not found");
                    return;
                }

                WebPlugin.isChatboxOpen = true;
                chatObserver.disconnect();
                resolve(getChatData());
            });
            chatObserver.observe(document.body, { childList: true, subtree: true });
        });
    }

    function getChatData() {
        const chatNameEle = document.querySelector("#main ._amie ._amig");
        const chatName = chatNameEle ? chatNameEle.innerText.trim() : "Unknown";
    
        WebPlugin.currentChatTitle = chatName;
    
        const isSaved = !/^\+?\d{1,4}[\s-]?(\d[\s-]?){6,14}\d$/.test(chatName);
        const headerText = chatNameEle?.closest("._amie")?.innerText || "";
    
        const chatType = isSaved 
            ? (headerText.includes("group") ? "Group" : headerText.includes("Business") ? "Business" : "User") 
            : "Unknown";
    
        return { isSaved, type: chatType };
    }
    

    function processChat(chatResult) {
        if (chatResult.isSaved) {
            if (chatResult.type === "Group") {
                Utils.logAndAlert('This is a group chat.');
            } else {
                openProfileSidebar(chatResult);
            }
        } else {
            Utils.logAndAlert(`This is a chat with an unsaved number.\nPhone Number: ${WebPlugin.currentChatTitle}`);
        }
    }

    function openProfileSidebar(chatResult) {
        const profileButton = document.querySelector('#main header div[title="Profile details"][role="button"], #main header span[data-testid="default-user"]');
        if (profileButton) {
            profileButton.click();
            setTimeout(() => checkSidebarOpened(chatResult), 1000);
        } else {
            Utils.log('Profile button not found. Retrying in 500ms...');
            setTimeout(() => openProfileSidebar(chatResult), 500);
        }
    }

    function checkSidebarOpened(chatResult) {
        const sidebar = document.querySelector('._aigv._aig-._aohg._arpo > .x10l6tqk.x13vifvy.xds687c.x1ey2m1c.x17qophe');
        if (sidebar) {
            Utils.log('Sidebar opened successfully.');
            getContactPhoneNumber(chatResult);
        } else {
            Utils.log('Failed to open the sidebar. Retrying...');
            setTimeout(() => openProfileSidebar(chatResult), 500);
        }
    }

    function getContactPhoneNumber(chatResult) {
        let phoneNumberElement;

        if (chatResult.type === "User") {
            phoneNumberElement = document.querySelector('span.x1jchvi3.x1fcty0u.x40yjcy');
        } else if (chatResult.type === "Business") {
            phoneNumberElement = document.querySelector('._ao3e.selectable-text.copyable-text > .x1lkfr7t.xdbd6k5.x1fcty0u.xw2npq5');
        }

        if (phoneNumberElement) {
            const phoneNumber = phoneNumberElement.innerText || 'Phone number not available';
            Utils.logAndAlert(`Contact Name: ${WebPlugin.currentChatTitle}\nPhone Number: ${phoneNumber}`);
            closeProfileSidebar();
        } else {
            Utils.log('Phone number not found. Retrying...');
            setTimeout(() => getContactPhoneNumber(chatResult), 500);
        }
    }

    function closeProfileSidebar() {
        const closeButton = document.querySelector('._aigv._aig-._aohg._arpo span[data-icon="x"][aria-hidden="true"]');
        if (closeButton) closeButton.click();
    }

    // Run the initialization on page load
    window.addEventListener('load', () => {
        Utils.log("Page loaded.");
        setTimeout(init, 1000);
    });
})();
