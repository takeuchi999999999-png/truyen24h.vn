import { Filter, ChevronDown, BookOpen, Star, Eye, Loader2 } from 'lucide-react';
import { Novel } from '../types';
import { GENRES } from '../constants';
import { useState, useMemo, useEffect } from 'react';
import Pagination from './Pagination';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

interface FilterViewProps {
  initialGenre?: string;
  initialSearch?: string;
  onNovelSelect: (novel: Novel) => void;
}

const ITEMS_PER_PAGE = 10;

function normalize(text: string) {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

export default function FilterView({ initialGenre, initialSearch, onNovelSelect }: FilterViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre || 'Tất cả');
  const [selectedStatus, setSelectedStatus] = useState<'Tất cả' | 'Đang ra' | 'Hoàn thành'>('Tất cả');
  const [selectedGroup, setSelectedGroup] = useState<string>('Tất cả');
  const [sortBy, setSortBy] = useState<'Lượt xem' | 'Đánh giá' | 'Mới nhất'>('Mới nhất');
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [allNovels, setAllNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const qNovels = query(collection(db, 'novels'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(qNovels, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel));
      setAllNovels(fetched);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'novels');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Update searchTerm when initialSearch changes
  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchTerm(initialSearch);
      setCurrentPage(1);
    }
  }, [initialSearch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre, selectedStatus, selectedGroup, searchTerm]);

  const translationGroups = useMemo(() => {
    const groups = new Set<string>();
    allNovels.forEach(novel => {
      if (novel.translationGroup) {
        groups.add(novel.translationGroup);
      }
    });
    return Array.from(groups).sort();
  }, [allNovels]);

  const filteredNovels = useMemo(() => {
    const normalizedSearch = normalize(searchTerm);
    
    return allNovels.filter(novel => {
      const genreMatch = selectedGenre === 'Tất cả' || (novel.genres && novel.genres.includes(selectedGenre));
      const statusMatch = selectedStatus === 'Tất cả' || novel.status === selectedStatus;
      const groupMatch = selectedGroup === 'Tất cả' || novel.translationGroup === selectedGroup;
      
      const searchMatch = !searchTerm || 
        (novel.title && normalize(novel.title).includes(normalizedSearch)) || 
        (novel.author && normalize(novel.author).includes(normalizedSearch));
        
      return genreMatch && statusMatch && groupMatch && searchMatch;
    });
  }, [allNovels, selectedGenre, selectedStatus, selectedGroup, searchTerm]);

  const totalPages = Math.ceil(filteredNovels.length / ITEMS_PER_PAGE);
  const paginatedNovels = filteredNovels.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCoverUrl = (url: string | undefined, id: string) => {
    return url || `https://picsum.photos/seed/novel-${id}/400/600`;
  };



  return (
    <main className="w-full max-w-[1200px] px-8 pb-32 mx-auto pt-12">
      <div className="flex flex-col gap-12">
        {/* Header & Filter Controls */}
        <div className="bg-surface p-10 rounded-[40px] shadow-2xl border border-accent/10">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Filter className="size-7" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-black text-text-main tracking-tighter uppercase">Bộ lọc truyện</h1>
              <p className="text-sm text-muted font-medium">Tìm kiếm bộ truyện phù hợp với sở thích của bạn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Genre Filter */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Thể loại</label>
              <div className="relative group">
                <select 
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full h-14 pl-6 pr-12 bg-background-light rounded-2xl border-none outline-none appearance-none font-bold text-text-main cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="Tất cả">Tất cả thể loại</option>
                  {GENRES.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-muted pointer-events-none group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Translation Group Filter */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Nhóm dịch</label>
              <div className="relative group">
                <select 
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full h-14 pl-6 pr-12 bg-background-light rounded-2xl border-none outline-none appearance-none font-bold text-text-main cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="Tất cả">Tất cả nhóm dịch</option>
                  {translationGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-muted pointer-events-none group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Trạng thái</label>
              <div className="flex bg-background-light p-1.5 rounded-2xl">
                {['Tất cả', 'Đang ra', 'Hoàn thành'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status as any)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${selectedStatus === status ? 'bg-surface text-primary shadow-md' : 'text-muted hover:text-text-main'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Sắp xếp theo</label>
              <div className="relative group">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full h-14 pl-6 pr-12 bg-background-light rounded-2xl border-none outline-none appearance-none font-bold text-text-main cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="Mới nhất">Mới cập nhật</option>
                  <option value="Lượt xem">Lượt xem nhiều nhất</option>
                  <option value="Đánh giá">Đánh giá cao nhất</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-muted pointer-events-none group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-black text-text-main uppercase tracking-tighter">
              Kết quả <span className="text-primary ml-2">({filteredNovels.length})</span>
            </h2>
          </div>

          {paginatedNovels.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {paginatedNovels.map((novel) => (
                  <div 
                    key={novel.id}
                    onClick={() => onNovelSelect(novel)}
                    className="flex flex-col gap-4 group cursor-pointer"
                  >
                    <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                      <img 
                        src={getCoverUrl(novel.coverUrl, novel.id)} 
                        alt={novel.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        {novel.isHot && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-black rounded-xl uppercase shadow-xl shadow-red-500/40">
                            <Star className="size-3 fill-white text-white" />
                            <span>Hot</span>
                          </div>
                        )}
                        {novel.status === 'Hoàn thành' && (
                          <span className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-xl uppercase shadow-xl">Full</span>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                         <div className="flex items-center gap-4 text-white animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-1.5">
                              <Star className="size-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-black text-sm">{novel.rating}</span>
                            </div>
                            <div className="w-[1px] h-3 bg-white/20"></div>
                            <div className="flex items-center gap-1.5">
                              <Eye className="size-4 text-white/80" />
                              <span className="font-bold text-sm">{novel.views}</span>
                            </div>
                         </div>
                      </div>
                    </div>
                    <div className="flex flex-col px-1">
                      <h3 className="font-bold text-text-main line-clamp-2 group-hover:text-primary transition-colors leading-tight text-base mb-1">{novel.title}</h3>
                      <p className="text-xs text-muted font-medium truncate">{novel.author}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-surface rounded-[40px] border border-dashed border-accent/20">
              <div className="p-6 bg-background-light rounded-full text-muted mb-6">
                <BookOpen className="size-12" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">Không tìm thấy truyện</h3>
              <p className="text-muted">Hãy thử thay đổi bộ lọc để tìm kiếm kết quả khác nhé!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
