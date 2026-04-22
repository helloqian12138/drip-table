---
title: 表格行样式 rowStyle
toc: content
---

## 表格行样式 rowStyle

- 描述：自定义表格行样式，支持字符串表达式或样式对象。
- 类型：

    ```typescript
    type RowStyle = string | Record<string, string>;
    ```

- 默认值：`undefined`
- 说明：会作用于数据行，并且如果配置了 `rowHeader` / `rowFooter`，同一条记录对应的插槽行也会一并纳入样式范围。`border`、`borderRadius`、`margin`、`marginTop`、`marginBottom` 会按整行进行渲染，其中 `margin` 会按 CSS 简写规则提取纵向间距。若表格配置了 `expandedRowRender` 或 `subtable`，扩展图标列只会出现在正常数据行，`rowHeader` / `rowFooter` 不会保留这列。

## 使用方法

```jsx
/**
 * transform: true
 * defaultShowCode: true
 * hideActions: ["CSB"]
 */
import React from "react";
import DripTable from "drip-table";

const schema = {
  rowHeader: {
    style: {
      background: "#f7faff",
      paddingLeft: "12px",
      borderBottom: "1px solid #f00",
    },
    elements: [
      { type: "text", text: "行头信息" },
    ],
  },
  rowStyle: {
    border: "1px solid #91b4ff",
    borderRadius: "10px",
    background: "#ffffff",
    margin: "8px 0 12px",
  },
  columns: [
    {
      key: "name",
      title: "商品名称",
      dataIndex: "name",
      component: "text",
      options: { mode: "single" },
    },
    {
      key: "description",
      title: "商品详情",
      dataIndex: "description",
      component: "text",
      options: { mode: "single", ellipsis: true },
    },
  ],
};

const dataSource = [
  { id: 1, name: "商品一", description: "说明一" },
  { id: 2, name: "商品二", description: "说明二" },
];

export default () => (
  <DripTable
    schema={schema}
    dataSource={dataSource}
    expandedRowRender={(record) => (
      <div style={{ padding: "12px 16px", textAlign: "center", background: "#fafafa" }}>
        {`${record.name} 的展开内容`}
      </div>
    )}
    rowExpandable={(record, index, parent) => record.id !== 1}
  />
);
```
