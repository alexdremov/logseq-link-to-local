import "@logseq/libs";

import React from "react";
import * as ReactDOM from "react-dom/client";

import App from "./App";
import { logseq as PL } from "../package.json";

import "./index.css";

const pluginId = PL.id;

function main() {
  console.info(`#${pluginId}: MAIN`);

  const root = ReactDOM.createRoot(document.getElementById("app")!);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  logseq.Editor.registerSlashCommand('/link to local', async () => {
    const storage = logseq.Assets.makeSandboxStorage()
    const currentBlock = await logseq.Editor.getCurrentBlock()
    const originalImages = currentBlock?.content.match(/!\[.*?\]\(https?(.*?)\.(?:png|jpg|jpeg|gif|bmp|mp3|wav|ogg|mp4|mov|avi|wmv|flv|pdf)\)/ig)

    if (!originalImages || originalImages.length === 0) {
      return
    }

    const originalUrls = originalImages.map(i => i.match(/https?(.*?)\.(png|jpg|jpeg|gif|bmp|mp3|wav|ogg|mp4|mov|avi|wmv|flv|pdf)/ig)?.[0])
    // const originalDescription = originalImages.map(i => (/!\[(.*?)\]/ig).exec(i)?.[1])
    const originalNames = originalImages.map(i => (/([^/]+)\.(png|jpg|jpeg|gif|bmp|mp3|wav|ogg|mp4|mov|avi|wmv|flv|pdf)/ig).exec(i)?.[0])
    const localPaths: string[] = []

    const saveImages = (item, index) => {
      return new Promise((resolve, reject) => {
        fetch(item)
          .then(res => res.arrayBuffer())
          .then(res => {
            storage.setItem(decodeURIComponent(originalNames[index] || '🤡'), res).then(one => {
              logseq.UI.showMsg(`Write DONE 🎉 - ${one}`, 'success')
              resolve(one.match(/\/assets\/(.*)/ig))
            })
          })
          .catch(error => {
            logseq.UI.showMsg(JSON.stringify(Object.keys(error).length !== 0 ? (error.message || error) : '请求失败'), 'error')
            reject(error)
          })
      })
    }

    Promise.all(
      originalUrls.map((item, index) => saveImages(item, index))
    ).then(paths => {
      paths.forEach(path => localPaths.push(`..${path[0]}`))

      let currentContent = currentBlock?.content
      originalUrls.forEach((item, index) => {
        currentContent = currentContent?.replace(item, localPaths[index])
      })

      logseq.Editor.updateBlock(currentBlock?.uuid, currentContent)
    }).catch(error => {
      logseq.UI.showMsg(JSON.stringify(Object.keys(error).length !== 0 ? (error.message || error) : '请求失败'), 'error')
    })
  })
}

logseq.ready(main).catch(console.error);
