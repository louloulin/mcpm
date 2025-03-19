import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, Tag } from 'lucide-react';

export interface FilterOptions {
  tags: string[];
  sort: 'newest' | 'oldest' | 'downloads' | 'rating';
  minRating: number;
  toolsRequired: string[];
}

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  selectedTags: string[];
  popularTags: string[];
}

const AdvancedFilter = ({ 
  onFilterChange, 
  selectedTags,
  popularTags 
}: AdvancedFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    tags: selectedTags,
    sort: 'newest',
    minRating: 0,
    toolsRequired: []
  });

  // Common tools that might be required
  const commonTools = [
    'http',
    'file-system',
    'database',
    'analytics',
    'communication'
  ];

  const handleSortChange = (sort: 'newest' | 'oldest' | 'downloads' | 'rating') => {
    const updatedFilters = { ...filters, sort };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleRatingChange = (rating: number) => {
    const updatedFilters = { ...filters, minRating: rating };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleToolToggle = (tool: string) => {
    const toolsRequired = filters.toolsRequired.includes(tool)
      ? filters.toolsRequired.filter(t => t !== tool)
      : [...filters.toolsRequired, tool];
    
    const updatedFilters = { ...filters, toolsRequired };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  const handleTagToggle = (tag: string) => {
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    const updatedFilters = { ...filters, tags };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
      >
        <div className="flex items-center text-gray-700">
          <Filter className="h-4 w-4 mr-2" />
          <span className="font-medium">高级筛选</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <h4 className="font-medium text-gray-700 mb-2">热门标签</h4>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* 排序选项 */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">排序方式</h4>
            <div className="space-y-2">
              {[
                { id: 'newest', label: '最新发布' },
                { id: 'oldest', label: '最早发布' },
                { id: 'downloads', label: '下载量' },
                { id: 'rating', label: '评分' }
              ].map((option) => (
                <label 
                  key={option.id} 
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="sort"
                    checked={filters.sort === option.id}
                    onChange={() => handleSortChange(option.id as any)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 评分筛选 */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">最低评分</h4>
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((rating) => (
                <label 
                  key={rating} 
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === rating}
                    onChange={() => handleRatingChange(rating)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {rating === 0 ? '全部' : `${rating}星及以上`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 工具要求 */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">支持的工具</h4>
            <div className="space-y-2">
              {commonTools.map((tool) => (
                <label 
                  key={tool} 
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.toolsRequired.includes(tool)}
                    onChange={() => handleToolToggle(tool)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{tool}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter; 