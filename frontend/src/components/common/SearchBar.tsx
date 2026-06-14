import React, { useState } from 'react';
import { Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');

  const handleSearch = () => {
    if (keyword.trim()) {
      onSearch(keyword.trim());
    }
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        placeholder="搜索错题内容..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onPressEnter={handleSearch}
        allowClear
        style={{ maxWidth: 400 }}
        prefix={<SearchOutlined />}
      />
      <Input.Search
        enterButton="搜索"
        onSearch={handleSearch}
        style={{ width: 100 }}
      />
    </Space.Compact>
  );
};

export default SearchBar;
