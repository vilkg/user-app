import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Paper } from 'material-ui';
import _ from '../constants/lodash';
import api from '../api';
import i18n from 'd2-i18n';
import parseDateFromUTCString from '../utils/parseDateFromUTCString';
import LoadingMask from 'd2-ui/lib/loading-mask/LoadingMask.component';
import ErrorMessage from './ErrorMessage';
import Heading from 'd2-ui/lib/headings/Heading.component';
import IconLink from './IconLink';
import RaisedButton from 'material-ui/RaisedButton';
import ImageEdit from 'material-ui/svg-icons/image/edit';
import ContentSend from 'material-ui/svg-icons/content/send';
import { Link } from 'react-router-dom';
import { USER, DETAILS } from '../constants/entityTypes';
import { connect } from 'react-redux';
import { getItem } from '../actions';

const styles = {
    main: {
        width: '100%',
        paddingLeft: '2rem',
    },
    heading: {
        paddingBottom: '1rem',
    },
    raisedButton: {
        height: '36px',
        transform: 'translateY(10px)',
        float: 'right',
        marginLeft: '1rem',
    },
    paper: {
        padding: '1.4rem',
    },
    cell: {
        fontSize: '1rem',
        padding: '0.8rem',
        verticalAlign: 'top',
    },
    valueCell: {
        textAlign: 'right',
        color: '#757575',
    },
};

class DetailSummary extends Component {
    componentWillMount() {
        const { baseName, routeId, getItem } = this.props;
        getItem(baseName, DETAILS, routeId);
    }

    renderSendMessageBtn(userId) {
        const url = `${api.getContextPath()}/dhis-web-messaging/showSendMessage.action?id=${userId}`;
        return (
            <RaisedButton
                style={styles.raisedButton}
                label={i18n.t('Send message')}
                secondary={true}
                containerElement={<a href={url}> </a>}
                icon={<ContentSend />}
            />
        );
    }

    renderPropertyFields() {
        const { summaryObject, config } = this.props;
        const labelCellStyle = { ...styles.cell, ...styles.valueCell };

        return config.map((field, index) => {
            let {
                key,
                label,
                removeText,
                parseDate,
                nestedPropselector,
                parseArrayAsCommaDelimitedString,
                count,
            } = field;
            label = i18n.t(label);
            let value = summaryObject[key];

            if (typeof value === 'undefined') {
                value = '';
            } else {
                if (nestedPropselector) {
                    nestedPropselector.forEach(selector => {
                        value = value[selector];
                    });
                }

                if (parseArrayAsCommaDelimitedString) {
                    // Some nested lists come through as a modelCollection but others are already arrays
                    if (typeof value.toArray === 'function') {
                        value = value.toArray();
                    }
                    value = value
                        .map(item => item[parseArrayAsCommaDelimitedString])
                        .join(', ');
                }

                if (removeText) {
                    value = _.capitalize(value.replace(removeText, ''));
                }

                if (parseDate && typeof value === 'string') {
                    value = parseDateFromUTCString(value);
                }

                if (count) {
                    if (typeof value.size === 'number') {
                        value = value.size;
                    } else if (typeof value.length === 'number') {
                        value = value.length;
                    }
                }
            }

            return (
                <tr key={index}>
                    <td style={labelCellStyle}>{label}</td>
                    <td style={styles.cell}>{value}</td>
                </tr>
            );
        });
    }

    render() {
        const { summaryObject, baseName } = this.props;

        if (summaryObject === null) {
            return <LoadingMask />;
        }

        if (typeof summaryObject === 'string') {
            const errorText = i18n.t(`There was an error fetching the ${baseName}`);
            return <ErrorMessage introText={errorText} errorMessage={summaryObject} />;
        }

        const { id, displayName, access } = summaryObject;
        const plural = `${baseName}s`,
            baseRoute = `/${_.kebabCase(plural)}`,
            backTooltip = i18n.t(`Back to ${plural}`),
            editLink = `${baseRoute}/edit/${id}`,
            editTooltip = i18n.t(`Edit ${baseName}`);

        return (
            <main style={styles.main}>
                <Heading style={styles.heading}>
                    <IconLink to={baseRoute} tooltip={backTooltip} icon="arrow_back" />
                    {displayName}

                    {access.update ? (
                        <RaisedButton
                            style={styles.raisedButton}
                            label={editTooltip}
                            primary={true}
                            containerElement={<Link to={editLink} />}
                            icon={<ImageEdit />}
                        />
                    ) : null}

                    {baseName === USER ? this.renderSendMessageBtn(id) : null}
                </Heading>
                <Paper style={styles.paper}>
                    <table>
                        <tbody>{this.renderPropertyFields()}</tbody>
                    </table>
                </Paper>
            </main>
        );
    }
}

DetailSummary.propTypes = {
    summaryObject: PropTypes.object,
    routeId: PropTypes.string.isRequired,
    config: PropTypes.array.isRequired,
    baseName: PropTypes.string.isRequired,
    getItem: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    summaryObject: state.currentItem,
});

export default connect(mapStateToProps, {
    getItem,
})(DetailSummary);
