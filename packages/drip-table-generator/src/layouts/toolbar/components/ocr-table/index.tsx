/**
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : helloqian12138 (johnhello12138@163.com)
 * @modifier : helloqian12138 (johnhello12138@163.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */

import { InboxOutlined } from '@ant-design/icons';
import { message, Spin, Upload, UploadProps } from 'antd';
import React from 'react';

import { filterAttributes, mockId } from '@/utils';
import { GeneratorContext } from '@/context';
import { DTGTableConfigsContext, TableConfigsContext } from '@/context/table-configs';
import { jsonToUrlParams, OPEN_AI_API_HOST } from '@/layouts/toolbar/components/assistant/utils';

const { Dragger } = Upload;

const OcrTable = () => {
  const { currentTableID } = React.useContext(GeneratorContext);
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

  const gptSchemaHandle = (colsTitle: string,
    tableConfigs: DTGTableConfigsContext['tableConfigs'],
    updateTableConfig: DTGTableConfigsContext['updateTableConfig']) => {
    setLoading(true);
    let tempMessages = '';
    const conversations = [...history];
    const taskMessage = `您好，请生成一份水滴表格配置数据，列包括：${colsTitle}。`;
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

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    action: 'http://localhost:8090/api/v1/ocr/image',
    onDrop(e) {
      console.debug('Dropped files', e.dataTransfer.files);
    },
  };

  /*
   * React.useEffect(() => {
   *   const data = new FormData();
   *   data.append('bizId', 'drip');
   *   data.append('bizToken', 'c4b71c84-fb80-4dcb-94ca-4f25d37d0ae5');
   *   data.append('input', 'chatgptRelay is already connected');
   *   data.append('model', 'text-embedding-ada-002');
   *   data.append('userId', 'qianjing29');
   *   fetch('http://jx-chatgpt-relay-beta.jx-promote.svc.hk03.n.jd.local/chatgptrelay/embeddings', {
   *     method: 'POST',
   *     body: data,
   *   })
   *     .then(res => res.json())
   *     .then(res => console.debug(res))
   *     .catch((error: unknown) => console.error(error));
   * }, []);
   */

  React.useEffect(() => {
    fetch('http://jx-chatgpt-relay-prod02.jx-promote.svc.hk2.n.jd.local/vs/search_doc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'chunk_conent=false&chunk_size=1000&knowledge_base_id=hibox&question=什么是hibox&score_threshold=0.5&top_k=3',
    })
      .then(res => res.json())
      .then(res => console.debug(res))
      .catch((error: unknown) => console.error(error));
  }, []);

  return (
    <TableConfigsContext.Consumer>
      { ({ tableConfigs, updateTableConfig, updateTableConfigs }) => (
        <Spin spinning={loading}>
          <Dragger
            {...props}
            onChange={(info) => {
              const { status } = info.file;
              if (status === 'done') {
                message.success(`${info.file.name} file uploaded successfully.`);
                const response = info.file.response;
                if (response.ParsedResults?.[0]?.ParsedText) {
                  const colsTitle = response.ParsedResults?.[0].ParsedText.split('\r\n').join(', ');
                  gptSchemaHandle(colsTitle, tableConfigs, updateTableConfig);
                }
              } else if (status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
              }
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击添加文件或者将文件拖拽至此区域</p>
          </Dragger>
        </Spin>
      ) }
    </TableConfigsContext.Consumer>
  );
};

export default OcrTable;
