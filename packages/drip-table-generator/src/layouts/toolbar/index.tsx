/**
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : helloqian12138 (johnhello12138@163.com)
 * @modifier : helloqian12138 (johnhello12138@163.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */
import './index.less';

import { CheckOutlined, CloseOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Image, message, Modal } from 'antd';
import classNames from 'classnames';
import { DripTableExtraOptions, DripTableSchema } from 'drip-table';
import React from 'react';

import { filterAttributes, mockId } from '@/utils';
import { GeneratorContext } from '@/context';
import { TableConfigsContext } from '@/context/table-configs';
import { generateTableConfigsBySchema, getSchemaValue } from '@/layouts/utils';
import { DataSourceTypeAbbr, DripTableGeneratorProps } from '@/typing';

import Assistant from './components/assistant';
import DataSourceEditor from './components/datasource';
import DropDownButton, { DropDownButtonProps } from './components/dropdown-button';
import ExportSchema from './components/export-schema';
import ImportSchema from './components/import-schema';
import { DTGBuiltInTemplates } from './templates';

function generateDropdownProps(props: {
  name: string;
  label: string;
  mode?: 'modal' | 'page';
  width?: number;
  height?: number;
}): Omit<DropDownButtonProps, 'children'> {
  return {
    dataIndex: props.name,
    label: props.label,
    width: props.width ?? 1000,
    height: props.height ?? 588,
    mode: props.mode,
  };
}

const ModeSwitch = (props: { style?: React.CSSProperties }) => (
  <GeneratorContext.Consumer>
    { ({ mode, setState }) => (
      <Button
        style={{ marginLeft: 24, borderRadius: '6px', ...props.style }}
        onClick={() => setState({ mode: mode === 'edit' ? 'preview' : 'edit', drawerType: void 0 })}
      >
        { mode === 'edit' ? '预览' : '编辑' }
      </Button>
    ) }
  </GeneratorContext.Consumer>
);

const Toolbar = <
RecordType extends DataSourceTypeAbbr<NonNullable<ExtraOptions['SubtableDataSourceKey']>>,
ExtraOptions extends Partial<DripTableExtraOptions> = never,
>(props: DripTableGeneratorProps<RecordType, ExtraOptions>) => {
  const { drawerType, currentTableID, setState } = React.useContext(GeneratorContext);
  const [defaultTemplate, setTemplate] = React.useState('');
  const [operateMenu, setOperateMenu] = React.useState(void 0 as string | undefined);
  const onOpen = (isOpen: boolean, key: string) => {
    setOperateMenu(isOpen ? key : void 0);
  };

  React.useEffect(() => {
    if (operateMenu && drawerType) {
      setState({ drawerType: void 0 });
    }
  }, [operateMenu]);

  const bodyHeight = (props.height ?? 640) - 52;

  return (
    <TableConfigsContext.Consumer>
      { ({ tableConfigs, updateTableConfig, updateTableConfigs }) => (
        <div className="jfe-drip-table-generator-templates-toolbar wrapper">
          <div className="jfe-drip-table-generator-templates-toolbar left">
            { props.showTemplate && (
            <DropDownButton
              {...generateDropdownProps({ name: 'template', label: '模版', mode: props.mode, width: props.width, height: bodyHeight })}
              open={operateMenu === 'template'}
              onOpen={onOpen}
              disabled={!!operateMenu && operateMenu !== 'template'}
            >
              <div className="jfe-drip-table-generator-templates-container">
                { DTGBuiltInTemplates.map((iTemplate, key) => (
                  <div
                    className={classNames('jfe-drip-table-generator-templates-wrapper', { checked: iTemplate.key === defaultTemplate })}
                    key={key}
                    onClick={() => {
                      if (tableConfigs.length > 0 && tableConfigs[0].columns.length > 0) {
                        Modal.confirm({
                          title: '此操作会覆盖当前正在编辑的表格，确定要这么做吗?',
                          icon: <ExclamationCircleFilled />,
                          okText: '确定',
                          okType: 'danger',
                          cancelText: '我再想想',
                          onOk() {
                            setTemplate(iTemplate.key);
                            const newTableConfigs = generateTableConfigsBySchema(iTemplate.schema as DripTableSchema);
                            updateTableConfigs(newTableConfigs);
                          },
                        });
                      } else {
                        setTemplate(iTemplate.key);
                        const newTableConfigs = generateTableConfigsBySchema(iTemplate.schema as DripTableSchema);
                        updateTableConfigs(newTableConfigs);
                      }
                    }}
                  >
                    { iTemplate.key === defaultTemplate && (
                    <div className="jfe-drip-table-generator-templates-wrapper-corner">
                      <CheckOutlined style={{ color: '#ffffff', marginRight: '2px' }} />
                    </div>
                    ) }
                    <div><Image width={112} height={112} src={iTemplate.previewImg} preview={false} /></div>
                    <div><span>{ iTemplate.label }</span></div>
                  </div>
                )) }
              </div>
            </DropDownButton>
            ) }
            <DropDownButton
              {...generateDropdownProps({ name: 'datasource', label: '数据源', mode: props.mode, width: props.width, height: bodyHeight })}
              open={operateMenu === 'datasource'}
              onOpen={onOpen}
              style={{ marginLeft: 24 }}
              innerStyle={{ padding: 0, background: '#1e1e1e' }}
              disabled={!!operateMenu && operateMenu !== 'datasource'}
            >
              <DataSourceEditor
                width={props.width ?? 1000}
                height={bodyHeight - 8}
                onDataSourceChange={dataSource => props.onDataSourceChange?.(dataSource as RecordType[])}
              />
            </DropDownButton>
            <DropDownButton
              {...generateDropdownProps({ name: 'import', label: '配置导入', mode: props.mode, width: props.width, height: bodyHeight })}
              open={operateMenu === 'import'}
              onOpen={onOpen}
              style={{ marginLeft: 24 }}
              innerStyle={{ padding: '0 0 8px 0' }}
              disabled={!!operateMenu && operateMenu !== 'import'}
            >
              <ImportSchema height={bodyHeight - 8 - 40} />
            </DropDownButton>
            <DropDownButton
              {...generateDropdownProps({ name: 'export', label: '配置编辑', mode: props.mode, width: props.width, height: bodyHeight })}
              open={operateMenu === 'export'}
              onOpen={onOpen}
              style={{ marginLeft: 24 }}
              innerStyle={{ padding: '0 0 8px 0' }}
              disabled={!!operateMenu && operateMenu !== 'export'}
            >
              <ExportSchema
                height={bodyHeight - 8 - 40}
                mode={props.mode}
              />
            </DropDownButton>
            <ModeSwitch style={operateMenu ? { opacity: '0.0', visibility: 'hidden' } : void 0} />
            { props.save && (
            <Button
              type="primary"
              style={{ marginLeft: 24,
                borderRadius: '6px',
                opacity: operateMenu ? '0.0' : void 0,
                visibility: operateMenu ? 'hidden' : void 0 }}
              onClick={() => props.onSave?.(getSchemaValue(tableConfigs))}
            >
              保存
            </Button>
            ) }
          </div>
          <div className="jfe-drip-table-generator-templates-toolbar right">
            <DropDownButton
              {...generateDropdownProps({ name: 'assistant', label: 'Drip Copilot', mode: props.mode, width: 380, height: bodyHeight })}
              open={operateMenu === 'assistant'}
              onOpen={onOpen}
              style={{ marginLeft: 24 }}
              innerStyle={{ padding: '0 0 8px 0', left: 'calc(100% - 380px)' }}
              disabled={!!operateMenu && operateMenu !== 'assistant'}
            >
              <Assistant
                onExportData={(data) => {
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
                    message.error('解析出错, 请输入正确的JSON数据');
                  }
                }}
              />
            </DropDownButton>
            { props.mode === 'modal' && <Button onClick={props.onClose} className="jfe-drip-table-generator-templates-close" type="text" icon={<CloseOutlined />} /> }
          </div>
        </div>
      ) }
    </TableConfigsContext.Consumer>
  );
};

export default Toolbar;
