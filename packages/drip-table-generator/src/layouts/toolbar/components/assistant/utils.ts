/**
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : helloqian12138 (johnhello12138@163.com)
 * @modifier : helloqian12138 (johnhello12138@163.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */

export const createGptService = () => fetch('http://127.0.0.1:8001/api/v1/assistant/createChat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(res => res.json());

export const fetchGptService = (content: string, connId: string) => fetch('http://127.0.0.1:8001/api/v1/assistant/sse/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: content, connId }),
})
  .then(res => res.json());

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
