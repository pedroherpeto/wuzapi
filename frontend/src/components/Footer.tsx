import { Box, Typography, Link, Button, Grid } from '@mui/material';
import { WhatsApp as WhatsAppIcon } from '@mui/icons-material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailIcon from '@mui/icons-material/Email';
import LinkIcon from '@mui/icons-material/Link';

const Footer = () => {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5515998566622', '_blank');
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#0c1317',
        color: '#8696a0',
        py: 3,
        px: 3,
        borderTop: '1px solid #374045',
        width: '100%'
      }}
    >
      <Box sx={{ 
        maxWidth: {
          lg: '1200px',
          xl: '1400px'
        },
        mx: 'auto'
      }}>
        <Grid container spacing={4}>
          {/* Coluna 1 - Logo e Copyright */}
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WhatsAppIcon sx={{ fontSize: 24, color: '#00a884' }} />
              <Typography variant="h6" sx={{ color: '#e9edef' }}>
                WuzApi
              </Typography>
            </Box>
          </Grid>

          {/* Coluna 2 - Redes Sociais */}
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" sx={{ color: '#e9edef', mb: 2 }}>
              Redes Sociais
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="https://www.youtube.com/@ComunidadeZDG"
                target="_blank"
                rel="noopener"
                sx={{
                  color: '#8696a0',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': { color: '#00a884' }
                }}
              >
                <YouTubeIcon />
                <Typography variant="body2">YouTube</Typography>
              </Link>
              <Link
                href="https://www.instagram.com/comunidadezdg"
                target="_blank"
                rel="noopener"
                sx={{
                  color: '#8696a0',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': { color: '#00a884' }
                }}
              >
                <InstagramIcon />
                <Typography variant="body2">@comunidadezdg</Typography>
              </Link>
            </Box>
          </Grid>

          {/* Coluna 3 - Links */}
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" sx={{ color: '#e9edef', mb: 2 }}>
              Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="https://comunidadezdg.com.br"
                target="_blank"
                rel="noopener"
                sx={{
                  color: '#8696a0',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': { color: '#00a884' }
                }}
              >
                <LinkIcon />
                <Typography variant="body2">Comunidade ZDG</Typography>
              </Link>
              <Link
                href="https://comunidadezdg.com.br/zpro"
                target="_blank"
                rel="noopener"
                sx={{
                  color: '#8696a0',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': { color: '#00a884' }
                }}
              >
                <LinkIcon />
                <Typography variant="body2">ZPRO</Typography>
              </Link>
            </Box>
          </Grid>

          {/* Coluna 4 - Contato */}
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" sx={{ color: '#e9edef', mb: 2 }}>
              Contato
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="mailto:comunidadezdg@gmail.com"
                sx={{
                  color: '#8696a0',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': { color: '#00a884' }
                }}
              >
                <EmailIcon />
                <Typography variant="body2">comunidadezdg@gmail.com</Typography>
              </Link>
              <Button
                onClick={handleWhatsAppClick}
                startIcon={<WhatsAppIcon />}
                sx={{
                  color: '#8696a0',
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  padding: 0,
                  '&:hover': { 
                    color: '#00a884',
                    background: 'transparent'
                  }
                }}
              >
                +55 15 99856-6622
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Footer; 