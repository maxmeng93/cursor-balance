// 文件: src/extension.ts
import * as vscode from "vscode";
import axios from "axios";

/**
 * Cursor API 使用情况的响应接口
 */
interface CursorUsageResponse {
  "gpt-4": ModelUsage;
  "gpt-3.5-turbo": ModelUsage;
  "gpt-4-32k": ModelUsage;
  startOfMonth: string;
}

/**
 * 单个模型的使用情况接口
 */
interface ModelUsage {
  numRequests: number;
  numRequestsTotal: number;
  numTokens: number;
  maxRequestUsage: number | null;
  maxTokenUsage: number | null;
}

/**
 * 插件激活时调用
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("Cursor Balance 已激活");

  // 注册命令
  let disposable = vscode.commands.registerCommand(
    "cursor-balance.showBalance",
    async () => {
      try {
        const config = vscode.workspace.getConfiguration("cursorBalance");
        const token = config.get<string>("token");
        const userId = token?.split("::")?.[1];

        // 检查配置是否完整
        if (!token || !userId) {
          const configureNow = "立即配置";
          const response = await vscode.window.showErrorMessage(
            "请先在设置中配置您的Cursor API凭证",
            configureNow
          );

          if (response === configureNow) {
            vscode.commands.executeCommand(
              "workbench.action.openSettings",
              "cursorBalance"
            );
          }
          return;
        }

        // 显示进度条
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "正在获取Cursor API使用情况...",
            cancellable: false,
          },
          async (progress) => {
            progress.report({ increment: 0 });

            try {
              const usageData = await fetchCursorUsage(userId, token);
              progress.report({ increment: 100 });
              showUsageWebview(usageData);
            } catch (error) {
              if (axios.isAxiosError(error)) {
                vscode.window.showErrorMessage(
                  `获取失败: ${error.response?.status} - ${error.message}`
                );
              } else {
                vscode.window.showErrorMessage(`获取失败: ${error}`);
              }
            }

            return Promise.resolve();
          }
        );
      } catch (error) {
        vscode.window.showErrorMessage(`发生错误: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

/**
 * 从Cursor API获取使用情况数据
 */
async function fetchCursorUsage(
  userId: string,
  token: string
): Promise<CursorUsageResponse> {
  try {
    const response = await axios.get(
      `https://www.cursor.com/api/usage?user=${userId}`,
      {
        headers: {
          Cookie: `WorkosCursorSessionToken=${token}`,
        },
      }
    );
    return response.data as CursorUsageResponse;
  } catch (error) {
    console.error("获取Cursor使用情况失败:", error);
    throw error;
  }
}

/**
 * 在WebView中显示使用情况
 */
function showUsageWebview(usageData: CursorUsageResponse) {
  // 创建并显示Webview
  const panel = vscode.window.createWebviewPanel(
    "cursorBalance",
    "Cursor Balance",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  // 设置Webview内容
  panel.webview.html = getWebviewContent(usageData);
}

/**
 * 生成WebView内容
 */
function getWebviewContent(usageData: CursorUsageResponse): string {
  const startDate = new Date(usageData.startOfMonth);
  const startDateStr = startDate.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  const remainingDays = Math.ceil(
    (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // 创建各模型的使用情况HTML
  const modelsHtml = createModelsHtml(usageData);

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cursor 余额</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 30px;
          color: var(--vscode-editor-foreground);
        }
        
        .period {
          text-align: center;
          font-size: 1.1em;
          margin-bottom: 30px;
          color: var(--vscode-descriptionForeground);
        }
        
        .card {
          background-color: var(--vscode-editor-inactiveSelectionBackground);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        .card-title {
          font-size: 1.4em;
          margin-top: 0;
          margin-bottom: 16px;
          color: var(--vscode-editorLink-activeForeground);
        }
        
        .usage-bar-container {
          width: 100%;
          height: 20px;
          background-color: var(--vscode-editor-background);
          border-radius: 10px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        
        .usage-bar {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #FFC107);
          border-radius: 10px;
          transition: width 0.5s ease-in-out;
        }
        
        .usage-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .unlimited {
          color: #4CAF50;
          font-weight: bold;
        }
        
        .data-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .data-label {
          color: var(--vscode-descriptionForeground);
        }
        
        .data-value {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Cursor 余额</h1>
        <div class="period">计费周期: ${startDateStr} 开始</div>
        <div class="period">下次重置: ${remainingDays - 1} 天后</div>
        
        ${modelsHtml}
      </div>
    </body>
    </html>
  `;
}

/**
 * 创建各模型使用情况的HTML
 */
function createModelsHtml(data: CursorUsageResponse): string {
  const modelKeys = ["gpt-4", "gpt-3.5-turbo", "gpt-4-32k"] as const;
  const modelNames = {
    "gpt-4": "Premium models",
    "gpt-3.5-turbo": "gpt-4o-mini or cursor-small",
    "gpt-4-32k": "GPT-4 32k",
  };

  let modelsHtml = "";

  modelKeys.forEach((key) => {
    const model = data[key];
    const name = modelNames[key];

    // 请求限制进度条
    let requestsLimit = "";
    let requestsPercent = 0;

    if (model.maxRequestUsage !== null) {
      requestsPercent = Math.min(
        100,
        (model.numRequests / model.maxRequestUsage) * 100
      );
      requestsLimit = `
        <div class="usage-bar-container">
          <div class="usage-bar" style="width: ${requestsPercent}%"></div>
        </div>
        <div class="usage-info">
          <span>已使用 ${model.numRequests} 次</span>
          <span>上限 ${model.maxRequestUsage} 次</span>
        </div>
      `;
    } else {
      requestsLimit = `
        <div class="usage-info">
          <span>已使用 ${model.numRequests} 次</span>
          <span class="unlimited">无限制</span>
        </div>
      `;
    }

    // Token用量显示
    let tokensUsage = "";
    if (model.maxTokenUsage !== null) {
      const tokensPercent = Math.min(
        100,
        (model.numTokens / model.maxTokenUsage) * 100
      );
      tokensUsage = `
        <div class="usage-bar-container">
          <div class="usage-bar" style="width: ${tokensPercent}%"></div>
        </div>
        <div class="usage-info">
          <span>已使用 ${model.numTokens.toLocaleString()} tokens</span>
          <span>上限 ${model.maxTokenUsage.toLocaleString()} tokens</span>
        </div>
      `;
    } else {
      tokensUsage = `
        <div class="usage-info">
          <span>已使用 ${model.numTokens.toLocaleString()} tokens</span>
          <span class="unlimited">无限制</span>
        </div>
      `;
    }

    // 添加到HTML中
    modelsHtml += `
      <div class="card">
        <h2 class="card-title">${name}</h2>
        
        <div class="data-row">
          <span class="data-label">请求次数:</span>
          <span class="data-value">${model.numRequests}</span>
        </div>
        ${requestsLimit}
        
        <div class="data-row">
          <span class="data-label">Token 用量:</span>
          <span class="data-value">${model.numTokens.toLocaleString()}</span>
        </div>
        ${tokensUsage}
      </div>
    `;
  });

  return modelsHtml;
}

/**
 * 插件停用时调用
 */
export function deactivate() {}
