import React from 'react';
import PropTypes from 'prop-types';
import { Box as MuiBox } from '@mui/material';

function PageBox({ children, sx = {}, maxWidth = '1400px', gap = 3, ...rest }) {
    return (
        <MuiBox
            sx={{
                p: 3,
                height: '100%',
                width: '100%',
                maxWidth,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap,
                ...sx,
            }}
            {...rest}
        >
            {children}
        </MuiBox>
    );
}

PageBox.propTypes = {
    children: PropTypes.node,
    sx: PropTypes.object,
    maxWidth: PropTypes.string,
    gap: PropTypes.number,
};

export default PageBox;
