export type GuideBlock = {
  heading: string;
  body: string;
  effect?: string;
};

export type GuideChapter = {
  id: string;
  title: string;
  blocks: GuideBlock[];
};

/** In-app admin manual — keep wording matched to real button labels */
export const ADMIN_GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: "start",
    title: "Start here",
    blocks: [
      {
        heading: "Your 5-minute master plan",
        body: "1) Click any text on the page and type. 2) Click a photo, then Change photo to upload a new one. 3) Use Add a block to insert a new section where you need it. 4) Click Save changes (yellow “Not saved yet” means visitors still see the old page). 5) More → View live page, then refresh that tab to confirm.",
        effect: "If you can do those five steps, you can edit any page on this site.",
      },
      {
        heading: "What this editor is",
        body: "You are editing the website on your screen. Nothing goes live until you click Save changes. Visitors keep seeing the last saved version until then.",
        effect: "Yellow “Not saved yet — visitors still see the old page” near Save means the public site has not been updated.",
      },
      {
        heading: "Open a page",
        body: "Use Page in the top bar to pick Homepage, About, Products, and so on. That loads that page’s blocks for editing.",
        effect: "Switching pages without saving drops unsaved edits on the page you left — Save first.",
      },
      {
        heading: "Open Help any time",
        body: "Click Help in the top bar, or More → Help. More → Show quick tips brings back the 4-step strip at the top. Full page at the top of this panel opens a readable copy you can keep in another tab.",
        effect: "Nothing on the live site changes when you open Help.",
      },
    ],
  },
  {
    id: "mistakes",
    title: "Common mistakes",
    blocks: [
      {
        heading: "Forgot Save changes",
        body: "You typed or swapped a photo, then left the editor. If you never clicked Save changes, the live website still shows the old version.",
        effect: "Always look for the yellow “Not saved yet” warning and click Save changes before you finish.",
      },
      {
        heading: "Switched page without saving",
        body: "The Page menu loads another page. Unsaved edits on the page you left are discarded.",
        effect: "Save changes first, then change pages.",
      },
      {
        heading: "Looking at the live tab without refresh",
        body: "More → View live page opens the public site. That tab does not update by itself after you save.",
        effect: "After Save, refresh the live tab (or reopen View live page) to see your edits.",
      },
      {
        heading: "Expecting Undo after a reload",
        body: "More → Undo (or Ctrl+Z) only works for edits in this session. After you close the tab or reload, that history is gone.",
        effect: "If you are unsure, Save often so you can always get back to a known good version.",
      },
    ],
  },
  {
    id: "text",
    title: "Edit text",
    blocks: [
      {
        heading: "Click to type",
        body: "Click any heading or paragraph. A dashed outline means it is editable. Type, then click outside the text to keep it.",
        effect: "The words change on this screen only. Click Save changes to publish them.",
      },
      {
        heading: "Optional footnote",
        body: "Some blocks have Optional footnote under this block. That line shows under the block on the live page.",
        effect: "Leave it empty if you do not want a footnote.",
      },
    ],
  },
  {
    id: "open-editor",
    title: "Opening the editor",
    blocks: [
      {
        heading: "Edit this page",
        body: "After you log in at /admin, visit any public page. A dark bar appears at the top with Edit this page. Visitors never see that bar.",
        effect: "One click opens the visual editor for the page you are looking at.",
      },
      {
        heading: "Log in",
        body: "Go to /admin, or on the public site click the company logo at the top-left five times quickly (a hidden staff shortcut). Enter the password your company gave you.",
        effect: "After login you land in the editor. The public site then shows the editing bar for you only. Ordinary visitors almost never find the five-click shortcut.",
      },
    ],
  },
  {
    id: "photos",
    title: "Photos and logos",
    blocks: [
      {
        heading: "Change a photo",
        body: "On a picture, use Change photo to upload a new file. If there is no picture yet, use Add photo. The old file is replaced in that slot.",
        effect: "The new image appears in the editor immediately; Save publishes it.",
      },
      {
        heading: "Drag to reframe",
        body: "Drag inside the photo to choose which part stays in the frame. Use the − / + buttons to zoom. Reset centres the crop again.",
        effect: "This crops the view, it does not stretch the file. Useful when a photo is off-centre.",
      },
      {
        heading: "Photo shape",
        body: "Wide, Landscape, Square, or Tall sets the frame for photos in that block. Photos fill the frame; mixed sizes will crop to fit.",
        effect: "Pick Square for even card rows; Wide for banners. Auto keeps the page default.",
      },
      {
        heading: "Gallery — Show as",
        body: "Photo grid = tiles in a row. Slideshow = photos that rotate. Logos = certification marks that sit whole in a tile (not cropped like a photo). Document pages = sized-down hub photos/charts; Auto shows the whole image, or pick a Photo shape to crop.",
        effect: "If a logo looks cut off or stuck in a corner, switch that gallery to Logos, then use Photo position.",
      },
      {
        heading: "Photo position (logos)",
        body: "In Logos mode, the 3×3 pad sets where the mark sits in the tile: middle, left, right, or a corner.",
        effect: "Middle centres ISO / SIRIM / Bomba. Left or right if a mark has extra empty space on one side.",
      },
    ],
  },
  {
    id: "blocks",
    title: "Blocks on a page",
    blocks: [
      {
        heading: "A page is a stack of blocks",
        body: "Each band of content (Page banner, Text section, Cards, Table, Contact box) is a block. Order on screen is top to bottom.",
        effect: "↑ Up / ↓ Down in the bar under a block moves it on the live page after you save.",
      },
      {
        heading: "Add a block",
        body: "Use Add a block (or + Add a block here between sections). Choose a type from the list. Everyday types show first; More options hides tables, tabs, and diagrams.",
        effect: "The new block is inserted at that spot. Fill it in, then Save changes.",
      },
      {
        heading: "Duplicate",
        body: "Copies the whole block, including photos and text, and places the copy underneath.",
        effect: "Handy when two sections should look the same except for the words.",
      },
      {
        heading: "Remove",
        body: "Deletes that block from the page after you confirm. This is not undoable after Save, though Undo works before you save (Ctrl+Z).",
        effect: "Visitors lose that section only after Save changes.",
      },
      {
        heading: "Layout (1–4 in a row)",
        body: "On Key highlights, Cards, Photo gallery, and Checklist, Layout sets how many items sit in a row on a wide screen (1 in a row, 2 in a row, and so on).",
        effect: "3 in a row is typical for certification marks. 2 in a row for larger photo cards. Key highlights can use 4 in a row when you have four points.",
      },
    ],
  },
  {
    id: "types",
    title: "What each block type is for",
    blocks: [
      {
        heading: "Page banner",
        body: "The large top of a page: brand line, headline, and optional background photo. Adding one always places it at the top of the page.",
        effect: "First thing visitors see. Other blocks move down when you add a banner.",
      },
      {
        heading: "Key highlights",
        body: "Numbered points (01, 02, 03) in a row. Use Layout on the bar under the block to choose 1–4 in a row.",
        effect: "Use for a few proof points, not a long story.",
      },
      {
        heading: "Text section",
        body: "A title and a paragraph. Simple writing block.",
      },
      {
        heading: "Photo with text",
        body: "Title and text beside one photo, or a slideshow. Use Layout (photo left or text left), then Photos (one photo or slideshow), then Photo shape.",
        effect: "Hint under the controls: Choose layout, then photo shape.",
      },
      {
        heading: "Cards",
        body: "Tiles with photo, title, short text, and a link. Card style can be normal photos or Cert / logo cards.",
        effect: "Use Cert / logo cards for ISO, SIRIM, FM, TÜV so marks stay sharp.",
      },
      {
        heading: "Checklist",
        body: "Bullet list next to rotating photos (Applications on a product page).",
      },
      {
        heading: "Spec list",
        body: "Rows such as Thickness → 100 mm. Product specifications.",
      },
      {
        heading: "Table",
        body: "Spreadsheet-style grid (property, test method, result). Add columns and rows as needed. Optionally highlight one row so it stands out on the public page.",
      },
      {
        heading: "Photo gallery",
        body: "A row of images. Use Show as to pick Photo grid, Slideshow, Logos, or Document pages, then Photo shape (or Photo position for logos only).",
      },
      {
        heading: "Expandable details",
        body: "Collapsed diagrams visitors open. Add extra diagram pages inside it.",
      },
      {
        heading: "Contact box",
        body: "Email, phone, WhatsApp, or any label + value, plus a button to Contact.",
      },
      {
        heading: "Highlight note",
        body: "One important sentence in a standout box.",
      },
      {
        heading: "Big numbers",
        body: "Big figures with short labels (year established, location).",
      },
      {
        heading: "Tabs",
        body: "Several inner pages in one block (tabs). Each tab can hold its own blocks.",
        effect: "Use when one topic has clearly separate slices (for example Overview vs Specs).",
      },
    ],
  },
  {
    id: "buttons",
    title: "Buttons on a block",
    blocks: [
      {
        heading: "Add a button",
        body: "Some blocks allow buttons underneath. Set the label, then where it goes: another page, a section on this page, email, or a web address.",
        effect: "Primary is the filled orange button; Ghost is the outline. Visitors click through after you save.",
      },
      {
        heading: "Go to a section",
        body: "Jump targets are named from the blocks already on this page (for example Spec list).",
        effect: "The page scrolls to that block. If you later remove the block, the jump will have nowhere to go.",
      },
    ],
  },
  {
    id: "save",
    title: "Save, undo, and safety",
    blocks: [
      {
        heading: "Save changes",
        body: "Writes this page to the server. That is the version the public website uses.",
        effect: "The “Not saved yet” warning clears. You should see “Saved — refresh the live page to see it.” Then open View live page and refresh to confirm.",
      },
      {
        heading: "Undo / Redo",
        body: "More → Undo, or Ctrl+Z (Cmd+Z on Mac). Redo is Ctrl+Y or Shift+Ctrl+Z.",
        effect: "Steps back through edits on this page in this session. After a full reload, that history is gone.",
      },
      {
        heading: "Leaving the page",
        body: "The browser will warn you if you close the tab with unsaved work.",
        effect: "If you ignore the warning, those edits are lost.",
      },
    ],
  },
  {
    id: "menu",
    title: "Website menu",
    blocks: [
      {
        heading: "Edit website menu",
        body: "More → Edit website menu (or /admin/nav). That is the top bar visitors use: Home, About, Products, and so on.",
        effect: "Changing a label or link here does not change the page content — only where the menu points.",
      },
      {
        heading: "Create a new empty page",
        body: "On the menu screen, give a title and a section (About / Products / Other), then Create empty page. It is added to the menu list. Save menu, then open that page in the editor and add blocks.",
        effect: "Until you add content and save the page, visitors see a placeholder.",
      },
      {
        heading: "Sub-links",
        body: "A main item can have dropdown children (About → Company Profile). Add a sub-link, pick the page, then Save menu.",
        effect: "The dropdown appears in the public header after save.",
      },
    ],
  },
];
