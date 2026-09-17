import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

// Dependency-free drag-to-reorder list built on RN core Animated + PanResponder
// (avoids adding react-native-draggable-flatlist, whose Reanimated 4 support
// is unclear — this needs no native rebuild).
//
// renderItem receives { item, isDragging, dragHandleProps } — spread
// dragHandleProps onto the element that should start the drag (e.g. a ☰ icon),
// not the whole row, so it doesn't conflict with onPress/onLongPress.
export default function ReorderableList({ items, itemHeight, keyExtractor, renderItem, onReorder, ListEmptyComponent }) {
    const [order, setOrder] = useState(() => items.map(keyExtractor));
    const orderRef = useRef(order);
    const itemsById = useRef({});
    items.forEach((item) => { itemsById.current[keyExtractor(item)] = item; });

    useEffect(() => { orderRef.current = order; }, [order]);

    const positions = useRef({});
    useEffect(() => {
        const newOrder = items.map(keyExtractor);
        setOrder(newOrder);
        orderRef.current = newOrder;
        newOrder.forEach((id, index) => {
            if (!positions.current[id]) positions.current[id] = new Animated.Value(index);
            else positions.current[id].setValue(index);
        });
    }, [items]);

    const [activeId, setActiveId] = useState(null);
    const responders = useRef({});

    const getResponder = (id) => {
        if (responders.current[id]) return responders.current[id];
        let startIndex = 0;

        responders.current[id] = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setActiveId(id);
                startIndex = orderRef.current.indexOf(id);
            },
            onPanResponderMove: (evt, gestureState) => {
                const rawIndex = startIndex + gestureState.dy / itemHeight;
                positions.current[id].setValue(rawIndex);

                const clamped = Math.max(0, Math.min(orderRef.current.length - 1, Math.round(rawIndex)));
                const currentIndex = orderRef.current.indexOf(id);
                if (clamped !== currentIndex) {
                    const newOrder = [...orderRef.current];
                    newOrder.splice(currentIndex, 1);
                    newOrder.splice(clamped, 0, id);
                    newOrder.forEach((otherId, index) => {
                        if (otherId !== id) {
                            Animated.timing(positions.current[otherId], { toValue: index, duration: 150, useNativeDriver: false }).start();
                        }
                    });
                    orderRef.current = newOrder;
                    setOrder(newOrder);
                    startIndex = clamped;
                }
            },
            onPanResponderRelease: () => {
                const finalIndex = orderRef.current.indexOf(id);
                Animated.timing(positions.current[id], { toValue: finalIndex, duration: 150, useNativeDriver: false }).start(() => {
                    setActiveId(null);
                    onReorder(orderRef.current.map((oid) => itemsById.current[oid]));
                });
            },
        });
        return responders.current[id];
    };

    if (order.length === 0) return ListEmptyComponent || null;

    return (
        <View style={{ height: itemHeight * order.length }}>
            {order.map((id) => {
                const item = itemsById.current[id];
                if (!item) return null;
                const translateY = Animated.multiply(positions.current[id], itemHeight);
                return (
                    <Animated.View
                        key={id}
                        style={[
                            styles.row,
                            { height: itemHeight, transform: [{ translateY }], zIndex: activeId === id ? 10 : 1, elevation: activeId === id ? 10 : 0 },
                        ]}
                    >
                        {renderItem({ item, isDragging: activeId === id, dragHandleProps: getResponder(id).panHandlers })}
                    </Animated.View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { position: 'absolute', left: 0, right: 0 },
});