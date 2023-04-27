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
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';

import { formatJson } from './utils';

export interface AssistantProps {
  onExportData?: (data: string) => void;
}

interface Conversation {
  role: 'user' | 'system' | 'assistant';
  message: string;
  loading: boolean;
}

const roleLabel = {
  user: '您',
  system: '系统消息',
  assistant: 'ChatGPT',
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

  const formatMessage = (content: string) => {
    const match = content.match(/(((示|实)例)|(配置))[：:](\s)?\{/u);
    if (match) {
      const index = match.index ?? -1;
      if (index > 0) {
        const start = index + match[0].length - 1;
        const codeEnd = content.lastIndexOf('}');
        const end = codeEnd <= start || loading ? content.length : codeEnd + 1;
        return (
          <React.Fragment>
            <span>{ content.slice(0, start) }</span>
            <div className="jfe-drip-table-generator-assistant-code-wrapper">
              { !loading && (
                <Button
                  style={{ position: 'absolute', right: 0 }}
                  onClick={() => props.onExportData?.(content.slice(start, end))}
                >
                  导入表格
                </Button>
              ) }
              <pre className="jfe-drip-table-generator-assistant-code-preview">
                { formatJson(content.slice(start, end)) }
              </pre>
              { !loading && (
                <Button
                  style={{ position: 'absolute', right: 0, bottom: 0 }}
                  onClick={() => props.onExportData?.(content.slice(start, end))}
                >
                  导入表格
                </Button>
              ) }
            </div>
            <span>{ content.slice(end, content.length) }</span>
          </React.Fragment>
        );
      }
    }
    return content;
  };

  return (
    <div className="jfe-drip-table-generator-assistant-wrapper">
      <Spin spinning={!chatId} style={{ height: '100%' }}>
        <div className="jfe-drip-table-generator-assistant-conversation" id={chatId}>
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
                <div className={classNames('jfe-drip-table-generator-assistant-chat-item', { assistant: item.role === 'assistant' })} key={index}>
                  <div className="jfe-drip-table-generator-assistant-chat-item-info">
                    <div className={classNames('jfe-drip-table-generator-assistant-chat-item-avatar', {
                      assistant: item.role === 'assistant',
                      user: item.role === 'user',
                    })}
                    />
                    <span className="jfe-drip-table-generator-assistant-chat-item-username">
                      { roleLabel[item.role] }
                    </span>
                  </div>
                  <div className="jfe-drip-table-generator-assistant-chat-item-message">
                    <div style={{ wordWrap: 'break-word', display: 'inline-block', width: item.loading ? void 0 : '100%' }}>
                      { formatMessage(item.message) }
                    </div>
                    { item.loading && <span className="jfe-drip-table-generator-assistant-cursor-blink" /> }
                  </div>
                </div>
              );
            }) }
          </div>
        </div>
        <div className="jfe-drip-table-generator-assistant-message">
          <Space.Compact style={{ width: '100%', alignItems: 'flex-end' }}>
            <Input
              placeholder="请输入您想问的问题"
              value={userContent}
              onChange={e => setUserContent(e.target.value)}
              onPressEnter={() => {
                chatWithBot(userContent);
                setUserContent('');
              }}
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
