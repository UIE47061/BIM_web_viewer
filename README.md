# BIM Web Viewer

一個基於 Web 的建築資訊模型（BIM）查看器，支援 IFC 格式文件的載入、瀏覽和檢視。

## ✨ 功能特性

- 📁 支援 IFC 格式文件的拖放上傳
- 🏗️ 建築樓層樹狀結構導覽
- 🔍 分類元件瀏覽
- 📊 元件屬性面板查看
- 🎨 3D 模型互動式查看（基於 Three.js）
- ✅ DRC（設計規則檢查）功能
- 🎯 工具列控制（選擇、平移、縮放等）

## 🛠️ 技術棧

- **前端框架**: Vue 3 (Composition API)
- **語言**: TypeScript
- **構建工具**: Vite
- **3D 渲染**: Three.js
- **IFC 解析**: web-ifc
- **狀態管理**: Pinia
- **路由**: Vue Router
- **圖標**: Material Design Icons

## 📦 安裝

```bash
# 安裝依賴
npm install

# 複製 WASM 檔案（postinstall 會自動執行）
npm run copy-wasm
```

## 🚀 使用

### 開發模式

```bash
npm run dev
```

啟動開發服務器，預設運行在 `http://localhost:5173`

### 構建生產版本

```bash
npm run build
```

構建產物將輸出到 `dist` 目錄

### 預覽生產版本

```bash
npm run preview
```

## 📁 項目結構

```
BIM_web_viewer/
├── public/                    # 靜態資源
│   ├── web-ifc-mt.worker.js  # Web IFC Worker
│   └── wasm/                  # WebAssembly 文件
├── src/
│   ├── components/            # Vue 組件
│   │   ├── common/           # 通用組件
│   │   ├── drc/              # DRC 面板
│   │   ├── sidebar/          # 側邊欄組件
│   │   └── viewer/           # 查看器組件
│   ├── router/               # 路由配置
│   ├── services/             # 業務服務層
│   │   ├── DrcService.ts     # DRC 服務
│   │   ├── IfcService.ts     # IFC 處理服務
│   │   └── SceneService.ts   # 3D 場景服務
│   ├── stores/               # Pinia 狀態管理
│   │   ├── drcStore.ts       # DRC 狀態
│   │   └── viewerStore.ts    # 查看器狀態
│   ├── types/                # TypeScript 類型定義
│   ├── views/                # 頁面視圖
│   ├── App.vue               # 根組件
│   ├── main.ts               # 應用入口
│   └── style.css             # 全局樣式
├── index.html                # HTML 模板
├── package.json              # 項目配置
├── tsconfig.json             # TypeScript 配置
└── vite.config.ts            # Vite 配置
```

## 💡 開發指南

### 載入 IFC 文件

1. 啟動應用後，使用文件拖放區域上傳 IFC 文件
2. 系統會自動解析並渲染 3D 模型
3. 在側邊欄可以查看樓層結構和元件分類

### 主要服務

- **IfcService**: 處理 IFC 文件的載入和解析
- **SceneService**: 管理 Three.js 3D 場景
- **DrcService**: 執行設計規則檢查

### 狀態管理

使用 Pinia 進行狀態管理：
- `viewerStore`: 管理查看器狀態（選中元件、樓層等）
- `drcStore`: 管理 DRC 檢查結果

## 🔧 環境要求

- Node.js >= 16.0.0
- npm >= 8.0.0