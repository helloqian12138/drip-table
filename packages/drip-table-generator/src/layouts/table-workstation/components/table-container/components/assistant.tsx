/**
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : helloqian12138 (johnhello12138@163.com)
 * @modifier : helloqian12138 (johnhello12138@163.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */

import { Button, Input, message, Spin } from 'antd';
import React from 'react';

import { filterAttributes, mockId } from '@/utils';
import { GeneratorContext } from '@/context';
import { DTGTableConfig, DTGTableConfigsContext, TableConfigsContext } from '@/context/table-configs';
import { jsonToUrlParams, OPEN_AI_API_HOST } from '@/layouts/toolbar/components/assistant/utils';

interface TableAssistantProps {
  tableConfig: DTGTableConfig;
}

const TableAssistant = (props: TableAssistantProps) => {
  const { currentTableID } = React.useContext(GeneratorContext);
  const [question, setQuestion] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState([] as { role: string; content: string }[]);

  const setTableSchema = (
    data: string,
    tableConfigs: DTGTableConfigsContext['tableConfigs'],
    updateTableConfig: DTGTableConfigsContext['updateTableConfig'],
  ) => {
    try {
      const code = JSON.parse(data);
      const globalConfigsToImport = filterAttributes(code, ['columns']);
      const columnsToImport = code.columns?.map((item, index) => ({ key: `${item.component}_${mockId()}`, ...item }));
      const index = currentTableID ? tableConfigs.findIndex(item => item.tableId === currentTableID) : 0;
      if (index > -1) {
        updateTableConfig({
          ...tableConfigs[index],
          configs: { ...globalConfigsToImport },
          columns: [...columnsToImport],
        }, index);
      } else {
        message.warning('未选中表格，请先选中您需要操作的表格');
      }
    } catch {
      message.error('解析出错，数据不符合规范');
    }
  };

  const gptSchemaHandle = (tableConfigs: DTGTableConfigsContext['tableConfigs'],
    updateTableConfig: DTGTableConfigsContext['updateTableConfig']) => {
    setLoading(true);
    console.debug(props.tableConfig);
    let tempMessages = '';
    const conversations = [...history];
    if (!question) {
      return;
    }
    let taskMessage = question;
    if (history.length <= 0) {
      taskMessage = `您好，${question}`;
    } else if (question.includes('添加') && question.includes('操作栏')) {
      taskMessage = `${question}, 采用link组件，options字段格式如下：{ "mode": "multiple", "operates": [{ "label": "编辑", "value": "edit", "href": "/product/edit/{id}"},{ "label": "删除", "value": "delete", "href": "/product/delete/{id}"}]}。`;
    }
    const urlParams = {
      history: history.length <= 0 ? void 0 : JSON.stringify(history),
      message: taskMessage,
      stream: true,
    };
    const evtSrc = new EventSource(`${OPEN_AI_API_HOST}/chat?${jsonToUrlParams(urlParams)}`, {
      withCredentials: true,
    });
    evtSrc.addEventListener('message', (event) => {
      try {
        const result = JSON.parse(event.data ?? '');
        if (result.done || !result) {
          setLoading(false);
          setQuestion('');
          evtSrc.close();
          const start = tempMessages.indexOf('```json');
          const end = tempMessages.indexOf('```', start + 7);
          const data = tempMessages.slice(start + 7, end).trim();
          setTableSchema(data, tableConfigs, updateTableConfig);
          console.debug(tempMessages);
          conversations.push(
            { role: 'user', content: taskMessage },
            { role: 'assistant', content: tempMessages },
          );
          setHistory(conversations);
          return;
        }
        tempMessages += result.message ?? '';
      } catch (error) {
        console.error(error);
        message.error((error as Error).message);
        evtSrc.close();
      }
    });
  };

  return (
    <TableConfigsContext.Consumer>
      { ({ tableConfigs, updateTableConfig, updateTableConfigs }) => (
        <div className="jfe-drip-table-generator-table-container-setting">
          <Spin spinning={loading}>
            <div style={{ display: 'flex' }}>
              <Input
                style={{ width: 200 }}
                placeholder="输入您要生成的表格场景"
                value={question}
                onChange={e => setQuestion(e.target.value)}
              />
              <Button type="primary" onClick={() => gptSchemaHandle(tableConfigs, updateTableConfig)}>生成</Button>
            </div>
          </Spin>
        </div>
      ) }
    </TableConfigsContext.Consumer>

  );
};

export default TableAssistant;
