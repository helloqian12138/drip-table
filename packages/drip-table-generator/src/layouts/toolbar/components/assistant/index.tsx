/**
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : helloqian12138 (johnhello12138@163.com)
 * @modifier : helloqian12138 (johnhello12138@163.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */

import './index.less';

import { LoadingOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Input, message, Space, Spin } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';

export interface AssistantProps {
}

interface Conversation {
  role: 'user' | 'system' | 'assistant';
  message: string;
  loading: boolean;
}

const roleLabel = {
  user: '您',
  system: '系统消息',
  assistant: 'chatGPT',
};

const Assistant = (props: AssistantProps) => {
  const [userContent, setUserContent] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [chatId, setChatId] = React.useState('');
  const [conversations, setConversations] = React.useState([] as Conversation[]);

  function startChat() {
    let conversationData: Conversation[] = [];
    const es = new EventSource('http://127.0.0.1:8001/api/v1/assistant/sse/create');
    es.addEventListener('message', (e) => {
      console.debug(e.data);
      const newConversations = cloneDeep([...conversationData]);
      if (e.data.startsWith('[DIGITAL_CHAT_ID]:')) {
        setChatId(e.data.replace('[DIGITAL_CHAT_ID]:', ''));
        const initConversations: Conversation[] = [
          { role: 'user', message: '您好', loading: false },
          { role: 'assistant', message: '', loading: true },
        ];
        setConversations(initConversations);
        conversationData = initConversations;
      } else if (e.data === '[DONE]') {
        es.close();
        newConversations[newConversations.length - 1] = { ...newConversations[newConversations.length - 1], loading: false };
        setConversations(newConversations);
        conversationData = newConversations;
      } else {
        const botMessage = `${newConversations[newConversations.length - 1].message}${e.data}`;
        newConversations[newConversations.length - 1] = { role: 'assistant', message: botMessage, loading: true };
        setConversations(newConversations);
        conversationData = newConversations;
      }
    });
  }

  React.useEffect(() => {
    startChat();
  }, []);

  const chatWithBot = (content: string) => {
    if (!chatId) {
      message.error('服务链接失败，请重启标签');
      return;
    }
    setLoading(true);
    let conversationData = cloneDeep([...conversations]);
    conversationData.push(
      { role: 'user', message: content, loading: false },
      { role: 'assistant', message: '', loading: true },
    );
    setConversations(conversationData);
    const es = new EventSource(`http://127.0.0.1:8001/api/v1/assistant/sse/chat?connId=${chatId}&message=${content}`);
    es.addEventListener('message', (e) => {
      console.debug(e.data);
      const newConversations = cloneDeep([...conversationData]);
      if (e.data === '[DONE]') {
        es.close();
        setLoading(false);
        newConversations[newConversations.length - 1] = { ...newConversations[newConversations.length - 1], loading: false };
        setConversations(newConversations);
        conversationData = newConversations;
      } else {
        const botMessage = `${newConversations[newConversations.length - 1].message}${e.data}`;
        newConversations[newConversations.length - 1] = { role: 'assistant', message: botMessage, loading: true };
        setConversations(newConversations);
        conversationData = newConversations;
      }
    });
  };

  return (
    <div className="jfe-drip-table-generator-assistant-wrapper">
      <Spin spinning={!chatId} style={{ height: '100%' }}>
        <div className="jfe-drip-table-generator-assistant-conversation">
          { chatId && <div>{ chatId }</div> }
          <div>
            { conversations.map((item, index) => {
              if (item.role === 'system') {
                return (
                  <div style={{ color: '#999', borderBottom: '1px solid #f00' }} key={index}>
                    { roleLabel[item.role] }
                    :
                    { ' ' }
                    { item.message }
                  </div>
                );
              }
              return (
                <div style={{ borderBottom: '1px solid #333' }} key={index}>
                  <div>
                    { roleLabel[item.role] }
                    :
                  </div>
                  <div>
                    <div>{ item.message }</div>
                    { item.loading && <span className="jfe-drip-table-generator-assistant-cursor-blink" /> }
                  </div>
                </div>
              );
            }) }
          </div>
        </div>
        <div className="jfe-drip-table-generator-assistant-message">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="请输入您想问的问题或者给一个指令"
              value={userContent}
              onChange={e => setUserContent(e.target.value)}
            />
            <Button
              loading={loading}
              disabled={loading}
              type="primary"
              icon={loading ? <LoadingOutlined /> : <SendOutlined />}
              onClick={() => {
                chatWithBot(userContent);
                setUserContent('');
              }}
            />
          </Space.Compact>
        </div>
      </Spin>

    </div>
  );
};

export default Assistant;
