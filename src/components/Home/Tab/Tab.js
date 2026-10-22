import { Link } from 'react-router';
import { isGroup } from '../../../data/links';
import MiniOrbit from './MiniOrbit';
import './Tab.css';

// One body in the orrery: a point of light with its label.
// Groups show a mini orbit of their children instead of a star, and open a new
// orbit level when clicked. An entry with no destination is shown but isn't a link.
const Tab = ({ link, mini, incl, groupPath, active, onActivate, onDeactivate }) => {
    const group = isGroup(link);
    const handlers = {
        onMouseEnter: onActivate,
        onMouseLeave: onDeactivate,
        onFocus: onActivate,
        onBlur: onDeactivate,
        className: `tab${group ? ' tab--group' : ''}${active ? ' tab--active' : ''}`,
        'aria-label': group ? `${link.title} (${link.children.length} inside)` : link.title,
        // Stop the browser's native link drag so the body can be dragged along its orbit
        draggable: false,
        onDragStart: (e) => e.preventDefault(),
    };

    const content = (
        <>
            {group && mini ? (
                <MiniOrbit bodies={mini} incl={incl} />
            ) : (
                <span className="tab__star" aria-hidden="true" />
            )}
            <span className="tab__label">
                <span className="tab__title tab__title--full">{link.title}</span>
                <span className="tab__title tab__title--short" aria-hidden="true">
                    {link.short ?? link.title}
                </span>
                {link.kind && <span className="tab__kind">{link.kind}</span>}
            </span>
        </>
    );

    if (group || link.to) {
        return (
            <Link to={group ? groupPath : link.to} {...handlers}>
                {content}
            </Link>
        );
    }
    if (link.href) {
        return (
            <a href={link.href} target="_blank" rel="noopener noreferrer" {...handlers}>
                {content}
            </a>
        );
    }
    const { draggable, onDragStart, ...rest } = handlers;
    return <span {...rest}>{content}</span>;
};

export default Tab;
