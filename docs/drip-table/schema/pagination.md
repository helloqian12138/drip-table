---
title: 分页 pagination
toc: content
---

## 分页配置 pagination

- 描述：是否展示分页以及配置
- 类型：

  ```typescript
  type Pagination = false | {
    size?: 'small' | 'default';
    pageSize?: number;
    position?: 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';
    showLessItems?: boolean;
    showQuickJumper?: boolean;
    showSizeChanger?: boolean;
    pageSizeOptions?: string[] | number[];
    hideOnSinglePage?: boolean;
    showTotal?: boolean | string;
  };
  ```

- 默认值：

  ```javascript
  {
    size: 'small',
    pageSize: 10,
    position: 'bottomRight',
    showLessItems: undefined,
    showQuickJumper: undefined,
    showSizeChanger: undefined,
    pageSizeOptions: undefined,
    hideOnSinglePage: undefined,
    showTotal: undefined,
  }
  ```

```jsx
/**
 * transform: true
 * defaultShowCode: true
 * hideActions: ["CSB"]
 */
import React from "react";
import DripTable from "drip-table";

const schema = {
  pagination: {
    size: 'default',
    pageSize: 10,
    position: 'bottomCenter',
    showLessItems: true,
    showQuickJumper: true,
    showSizeChanger: true,
    pageSizeOptions: [3, 5, 10, 20, 50],
    hideOnSinglePage: true,
    showTotal: 'Total: {{total}}',
    style: { margin: '5px 0', padding: '5px 0', border: '1px solid #eeeeee', background: '#fcfcfc' },
    pageNumberStyle: { borderRadius: '10px' },
    pageStepperStyle: { borderRadius: '10px' },
    pageSelectorStyle: { borderRadius: '10px' },
  },
  columns: [
    {
      key: "mock_1",
      title: "商品名称",
      dataIndex: "name",
      component: "text",
      options: { mode: "single", maxRow: 1 },
    },
    {
      key: "mock_2",
      title: "商品详情",
      align: "center",
      dataIndex: "description",
      component: "text",
      options: { mode: "single", ellipsis: true, maxRow: 1 },
    },
  ],
};

const dataSource = Array(200).fill(0).map((_, i) => ({
  id: i,
  name: "商品" + i,
  price: 7999,
  status: "onSale",
  description: "商品是为了出售而生产的劳动成果，是人类社会生产力发展到一定历史阶段的产物，是用于交换的劳动产品。",
}));

const Demo = () => {
  return (
    <DripTable
      schema={schema}
      dataSource={dataSource}
    />
  );
};

export default Demo;
```
