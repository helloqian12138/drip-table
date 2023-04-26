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
