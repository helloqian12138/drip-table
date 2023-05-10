/**
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : helloqian12138 (johnhello12138@163.com)
 * @modifier : helloqian12138 (johnhello12138@163.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */

export const AssistantParams = {
  ...process.env,
  temperature: 0,
  systemMessage: `根据下面的上下文回答问题。保持答案简短明了。如果不确定答案，请回答"不确定答案"。
  水滴表格，又称 drip table，用于中后台 CMS 列表页的快速搭建，通过简单 JSON Schema 数据即可生成表格。
  水滴表格配置数据是一个JSON数据，它包括id、columns、bordered、pagination、size、rowSelection、editable、stripe等字段。id为表格标识符；bordered类型为boolean，表示展示表格边框；size表示表格大小，枚举值，可取small 或 middle 或 large，默认为middle; rowSelection 表示是否支持选择栏；editable表示表格是否支持在线编辑；stripre表示表格是否展示斑马纹；pagination字段是表格的分页配置，包括 pageSize、 size、position字段，pageSize表示每页数据行数；size表示分页器大小，可取'small'和'default'；positions字段可取 topLeft 或 topCenter 或 topRight 或 bottomLeft或 bottomCenter 或bottomRight，默认为bottomRight。columns是表格的列配置，每一列包括 key、title、component、options和dataIndex字段。每一列的key字段是该列的唯一标识符，title字段表示该列的标题文案或者列头文案，component表示该列的单元格采用哪个组件渲染，其值为组件名，目前可以使用的组件名包括：'text'、'image'、'button'、'link'。text 是纯文本展示组件，image 是 图片组件、button是按钮组件。options对应组件类型的配置属性，默认为{}；dataIndex 是数据的字段值，用于获取数据。`,
};

export function formatJson(json: string): string {
  let indentLevel = 0;
  let result = '';
  let inString = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (inString) {
      result += char;

      if (char === '"' && json[i - 1] !== '\\') {
        inString = false;
      }

      continue;
    }

    switch (char) {
      case '{':
      case '[': {
        result += `${char}\n${' '.repeat((indentLevel + 1) * 2)}`;
        indentLevel += 1;
        break;
      }

      case '}':
      case ']': {
        indentLevel -= 1;
        result += `\n${' '.repeat(indentLevel * 2)}${char}`;
        break;
      }

      case ',': {
        result += `,\n${' '.repeat(indentLevel * 2)}`;
        break;
      }

      case ':': {
        result += ': ';
        break;
      }

      case '"': {
        result += char;
        inString = true;
        break;
      }

      default: {
        result += char;
        break;
      }
    }
  }

  return result;
}

export function jsonToUrlParams(json: Record<string, unknown>) {
  let params = '';
  Object.keys(json).forEach((key) => {
    if (json[key] !== void 0) {
      if (params.length > 0) {
        params += '&';
      }
      params += `${encodeURIComponent(key)}=${encodeURIComponent(String(json[key]))}`;
    }
  });
  return params;
}
