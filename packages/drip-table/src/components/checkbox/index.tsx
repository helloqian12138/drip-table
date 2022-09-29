/*
 * This file is part of the drip-table project.
 * @link     : https://drip-table.jd.com/
 * @author   : Emil Zhai (root@derzh.com)
 * @modifier : Emil Zhai (root@derzh.com)
 * @copyright: Copyright (c) 2021 JD Network Technology Co., Ltd.
 */

import classNames from 'classnames';
import RcCheckbox, { Props as RcCheckboxProps } from 'rc-checkbox';
import React from 'react';

import styles from './index.module.less';

export interface SelectProps extends RcCheckboxProps {}

const Checkbox = React.memo(({ ...props }: SelectProps) => (
  <label className={classNames(styles['jfe-drip-table-checkbox-wrapper'], styles['jfe-drip-table-checkbox-wrapper-checked'])}>
    <RcCheckbox
      {...props}
      prefixCls="jfe-drip-table-checkbox"
    />
  </label>
));

export default Checkbox;
