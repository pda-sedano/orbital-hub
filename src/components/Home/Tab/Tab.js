import { Link } from 'react-router';
import { isGroup } from '../../../data/links';
import './Tab.css';

// One body in the orrery: a point of light with its label.
// Groups get a ring around their star and open a new orbit level when clicked.
const Tab = ({ link, groupPath, active, onActivate, onDeactivate }) => {
    const group = isGroup(link);
    const handlers = {
        onMouseEnter: onActivate,
        onMouseLeave: onDeactivate,
        onFocus: onActivate,
        onBlur: onDeactivate,
        className: `tab${group ? ' tab--group' : ''}${active ? ' tab--active' : ''}`,
        'aria-label': group ? `${link.title} (${link.children.length} links inside)` : link.title,
        // Stop the browser's native link drag so the body can be dragged along its orbit
        draggable: false,
        onDragStart: (e) => e.preventDefault(),
    };

    const content = (
        <>
            <span className="tab__star" aria-hidden="true" />
            <span className="tab__label">
                <span className="tab__title tab__title--full">{link.title}</span>
                <span className="tab__title tab__title--short" aria-hidden="true">
                    {link.short ?? link.title}
                </span>
                <span className="tab__kind">{link.kind}</span>
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
    return (
        <a href={link.href} target="_blank" rel="noopener noreferrer" {...handlers}>
            {content}
        </a>
    );
};

export default Tab;
