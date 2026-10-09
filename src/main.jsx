import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DOMPurify from 'dompurify';
import './style.css';

const BLOG = 'https://pakyinwww.blogspot.com';
const PAGE_SIZE = 5;

// Blogger's public JSONP feed works across origins without a Google API key.
function readFeed(path = '', start = 1) {
  return new Promise((resolve, reject) => {
    const callback = `blogger_${crypto.randomUUID().replaceAll('-', '')}`;
    const script = document.createElement('script');
    const url = new URL(`${BLOG}/feeds/posts/default${path}`);
    url.search = new URLSearchParams({ alt: 'json-in-script', callback, 'max-results': PAGE_SIZE, 'start-index': start });
    const cleanup = () => {
      clearTimeout(timer);
      script.remove();
      // A late JSONP response must remain harmless after the timeout.
      window[callback] = () => {};
      setTimeout(() => delete window[callback], 60000);
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error('The blog took a little too long to reply.')); }, 15000);
    window[callback] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error('Couldn’t reach the blog right now.')); };
    script.src = url;
    document.head.append(script);
  });
}

function normalize(entry) {
  return {
    id: entry.id.$t.split('-').at(-1),
    title: entry.title?.$t || 'Untitled',
    content: entry.content?.$t || entry.summary?.$t || '',
    published: entry.published?.$t,
    url: entry.link?.find(link => link.rel === 'alternate')?.href || BLOG,
    labels: entry.category?.map(category => category.term) || [],
  };
}

function useRoute() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');
  useEffect(() => {
    const changed = () => { setRoute(window.location.hash.slice(1) || '/'); window.scrollTo({ top: 0, behavior: 'instant' }); };
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  return route;
}

const initialBalloons = Array.from({ length: 9 }, (_, index) => ({
  id: index, x: [5, 94, 14, 85, 38, 62, 23, 76, 50][index],
  size: [48, 58, 38, 44, 52, 36, 42, 54, 40][index],
  duration: 32 + index * 2.7, delay: -(index * 5.3 + 6),
}));

function Clouds() {
  return <div className="sky cloud-sky" aria-hidden="true">
    {[{ y: 18, size: 140, duration: 95, delay: -24 }, { y: 67, size: 110, duration: 125, delay: -88 }].map((cloud, index) =>
      <svg key={index} className="cloud" viewBox="0 0 160 80" style={{ '--cloud-y': `${cloud.y}%`, '--cloud-size': `${cloud.size}px`, '--cloud-duration': `${cloud.duration}s`, '--cloud-delay': `${cloud.delay}s`, '--cloud-rest-x': `${index === 0 ? 15 : 75}%` }}>
        <path d="M35 64C19 64 9 56 9 44c0-12 10-21 23-21 5 0 9 1 13 4C49 13 60 6 74 6c18 0 30 12 31 28 4-3 9-5 15-5 17 0 30 9 30 20 0 9-8 15-21 15Z" />
      </svg>
    )}
  </div>;
}

function Balloons() {
  const [popped, setPopped] = useState({});
  const timers = useRef(new Set());
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const pop = (id) => {
    if (popped[id]) return;
    setPopped(old => ({ ...old, [id]: true }));
    const timer = setTimeout(() => {
      setPopped(old => ({ ...old, [id]: false }));
      timers.current.delete(timer);
    }, 4200);
    timers.current.add(timer);
  };
  return <div className="sky" aria-label="Floating balloons">
    {initialBalloons.map(balloon => <div key={balloon.id} className="balloon-flight" style={{ '--x': `${balloon.x}%`, '--size': `${balloon.size}px`, '--duration': `${balloon.duration}s`, '--delay': `${balloon.delay}s` }}>
      <button className={`balloon ${popped[balloon.id] ? 'popped' : ''}`} onClick={() => pop(balloon.id)} aria-label="Pop balloon" disabled={Boolean(popped[balloon.id])}>
        <svg className="balloon-shape" viewBox="0 0 64 120" aria-hidden="true"><path className="balloon-body" d="M32 5C17 5 8 17 8 31c0 18 13 35 24 35s24-17 24-35C56 17 47 5 32 5Z" /><path className="balloon-shine" d="M18 23c1-5 4-8 8-10" /><path className="balloon-string" d="m32 66-4 6h8l-4-6m0 6c-12 16 12 24-1 43" /></svg>
        <span className="burst" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <i key={index} style={{ '--angle': `${index * 51.4}deg` }} />)}</span>
      </button>
    </div>)}
  </div>;
}

function Navigation({ route }) {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const toggle = useRef(null);
  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (event.type === 'pointerdown' && !container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', dismiss);
    document.addEventListener('pointerdown', dismiss);
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', dismiss); };
  }, [open]);
  return <header className="toolbar">
    <a className="home-mark" href="#/" aria-label="Blog home"><svg viewBox="0 0 24 32" aria-hidden="true"><ellipse cx="12" cy="11" rx="8" ry="10"/><path d="m12 21-2 3h4m-2 0c-4 4 4 4 0 7"/></svg></a>
    <div className="navigation" ref={container}>
      <button ref={toggle} className={`menu-toggle ${open ? 'is-open' : ''}`} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}><span /><span /></button>
      {open && <nav id="navigation" aria-label="Main navigation"><a href="#/" aria-current={route === '/' ? 'page' : undefined} onClick={() => setOpen(false)}>Blog <span>01</span></a><a href="#/contact" aria-current={route === '/contact' ? 'page' : undefined} onClick={() => setOpen(false)}>Contact <span>02</span></a><p>A little corner of the internet.</p></nav>}
    </div>
  </header>;
}

function Post({ post, single }) {
  const content = DOMPurify.sanitize(post.content, { ADD_ATTR: ['target'], FORBID_TAGS: ['style', 'form', 'input', 'button'], FORBID_ATTR: ['style'] });
  const date = post.published && new Date(post.published);
  return <article className="paper">
    <div className="post-meta"><time dateTime={post.published}>{date && new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)}</time><span className="meta-dot">·</span><span>pakyinwww</span></div>
    <h1 className="post-title">{single ? post.title : <a href={`#/post/${post.id}`}>{post.title}</a>}</h1>
    <div className="post-body" dangerouslySetInnerHTML={{ __html: content }} />
    <footer className="post-footer"><div className="labels">{post.labels.map(label => <span key={label}>{label}</span>)}</div><a href={single ? post.url : `#/post/${post.id}`} target={single ? '_blank' : undefined} rel={single ? 'noopener noreferrer' : undefined}>{single ? 'On Blogspot' : 'Permalink'} <span aria-hidden="true">↗</span></a></footer>
  </article>;
}

function App() {
  const route = useRoute();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [author, setAuthor] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const postId = route.match(/^\/post\/(\d+)$/)?.[1];
  const contact = route === '/contact';
  const unknown = route !== '/' && !contact && !postId;
  const load = useCallback(async (start, id, version) => {
    setLoading(true); setError('');
    try {
      const data = await readFeed(id ? `/${id}` : '', start);
      if (version !== generation.current) return;
      const entries = data.entry ? [data.entry] : data.feed?.entry || [];
      const nextPosts = entries.map(normalize);
      setPosts(old => start === 1 ? nextPosts : [...old, ...nextPosts.filter(post => !old.some(existing => existing.id === post.id))]);
      setTotal(Number(data.feed?.openSearch$totalResults?.$t || nextPosts.length));
      if (data.feed?.author?.[0]) setAuthor(data.feed.author[0]);
    } catch (failure) {
      if (version === generation.current) setError(failure.message);
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    generation.current += 1;
    if (contact || unknown) { setLoading(false); return; }
    setPosts([]);
    load(1, postId, generation.current);
    return () => { generation.current += 1; };
  }, [postId, contact, unknown, attempt, load]);

  return <><Clouds /><Balloons /><Navigation route={route} /><main id="main" className="reading-column">
    {postId && <a className="back-link" href="#/">← All entries</a>}
    {contact ? <section className="paper contact-paper"><span className="eyebrow">CONTACT</span><h1>Hello there.</h1><p>This little corner belongs to pakyinwww.</p><p>You can find me over on Blogspot.</p><a className="text-link" href={author?.uri?.$t || BLOG} target="_blank" rel="noopener noreferrer">Find me on Blogspot <span aria-hidden="true">↗</span></a></section>
      : unknown ? <section className="paper status-paper"><span className="eyebrow">404</span><h1>A little off course.</h1><p>This page doesn’t exist.</p><a className="text-link" href="#/">Back to the blog →</a></section>
      : <>
        {posts.map(post => <Post key={post.id} post={post} single={Boolean(postId)} />)}
        {loading && posts.length === 0 && <section className="paper skeleton" aria-label="Loading posts" role="status"><span className="eyebrow">FETCHING FROM BLOGSPOT</span><div className="skeleton-title" /><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line short" /><p>Just a moment.</p></section>}
        {error && <section className="paper status-paper" role="alert"><span className="eyebrow">A SMALL INTERRUPTION</span><h1>The sky’s still here.</h1><p>{error}</p><div className="status-actions"><button className="text-link" onClick={() => posts.length ? load(posts.length + 1, postId, generation.current) : setAttempt(old => old + 1)}>Try again ↻</button><a href={BLOG} target="_blank" rel="noopener noreferrer">Visit Blogspot ↗</a></div></section>}
        {!loading && !error && posts.length === 0 && <section className="paper status-paper"><span className="eyebrow">{postId ? 'ENTRY NOT FOUND' : 'A QUIET CORNER'}</span><h1>{postId ? 'This entry drifted away.' : 'Nothing here. Yet.'}</h1><p>{postId ? 'The entry may have been removed.' : 'There are no public entries in the Blogspot feed right now.'}</p><a className="text-link" href={postId ? '#/' : BLOG} target={postId ? undefined : '_blank'} rel="noopener noreferrer">{postId ? 'All entries' : 'Visit Blogspot'} ↗</a></section>}
        {!postId && posts.length > 0 && posts.length < total && !error && <button className="older-posts" disabled={loading} onClick={() => load(posts.length + 1, null, generation.current)}>{loading ? 'Loading…' : 'Older entries'} <span aria-hidden="true">↓</span></button>}
      </>}
    <footer className="site-footer"><a href={BLOG} target="_blank" rel="noopener noreferrer">Words from Blogspot <span aria-hidden="true">↗</span></a><span>Feel free to pop a balloon.</span></footer>
  </main></>;
}

createRoot(document.getElementById('root')).render(<App />);
