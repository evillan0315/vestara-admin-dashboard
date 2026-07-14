import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { BookText } from 'lucide-react';
import { docGroups, getDocById, resolveDocHref } from '../features/docs/docsContent';
import '../styles/markdown.css';

export default function DocsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedId = searchParams.get('doc');
  const initialDoc = useMemo(() => {
    if (requestedId) {
      const found = getDocById(requestedId);
      if (found) return found;
    }
    return docGroups[0]?.docs[0] ?? null;
  }, [requestedId]);

  const [selected, setSelected] = useState(initialDoc);

  const selectDoc = (id: string) => {
    const doc = getDocById(id);
    if (!doc) return;
    setSelected(doc);
    setSearchParams({ doc: id }, { replace: true });
  };

  if (!selected) {
    return (
      <Box p={3}>
        <Typography color="text.secondary">No documentation available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          mb: 2,
        }}
      >
        <BookText size={26} color="var(--mui-palette-primary-main)" />
        <Typography variant="h5" fontWeight={700}>
          Documentation
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 3 },
          alignItems: 'flex-start',
        }}
      >
        {/* Table of contents */}
        <Paper
          variant="outlined"
          sx={{
            width: { xs: '100%', md: 280 },
            flexShrink: 0,
            position: { md: 'sticky' },
            top: { md: 88 },
            maxHeight: { md: 'calc(100vh - 120px)' },
            overflowY: 'auto',
          }}
        >
          <List disablePadding>
            {docGroups.map((section, sectionIndex) => (
              <Box key={`${section.group}-${sectionIndex}`}>
                {sectionIndex > 0 && <Divider />}
                <Typography
                  variant="overline"
                  sx={{ display: 'block', px: 2, pt: 1.5, pb: 0.5, color: 'text.secondary' }}
                >
                  {section.group}
                </Typography>
                {section.docs.map((doc) => (
                  <ListItemButton
                    key={doc.id}
                    selected={selected.id === doc.id}
                    onClick={() => selectDoc(doc.id)}
                    sx={{ pl: 3 }}
                  >
                    <ListItemText
                      primary={doc.title}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        </Paper>

        {/* Document body */}
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 2, md: 4 },
            maxWidth: { md: 920 },
          }}
        >
          <article className="doc-markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img({ alt, ...props }) {
                  return (
                    <img
                      alt={alt}
                      loading="lazy"
                      decoding="async"
                      style={{ maxWidth: '100%', height: 'auto' }}
                      {...props}
                    />
                  );
                },
                a({ href, children, ...props }) {
                  const docId = href ? resolveDocHref(href) : null;
                  if (docId) {
                    return (
                      <a
                        href={`?doc=${docId}`}
                        onClick={(event) => {
                          event.preventDefault();
                          selectDoc(docId);
                        }}
                      >
                        {children}
                      </a>
                    );
                  }
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  );
                },
              }}
            >
              {selected.content}
            </ReactMarkdown>
          </article>
        </Paper>
      </Box>
    </Box>
  );
}
