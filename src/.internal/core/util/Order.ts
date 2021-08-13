export type Order = -1 | 0 | 1;

/**
 * @ignore
 */
export function compare<A extends string | number | boolean>(left: A, right: A): Order {
	if (left === right) {
		return 0;

	} else if (left < right) {
		return -1;

	} else {
		return 1;
	}
}

/**
 * @ignore
 */
export function compareArray<A>(left: ArrayLike<A>, right: ArrayLike<A>, f: (x: A, y: A) => Order): Order {
	const leftLength = left.length;
	const rightLength = right.length;

	const length = Math.min(leftLength, rightLength);

	for (let i = 0; i < length; ++i) {
		const order = f(left[i], right[i]);

		if (order !== 0) {
			return order;
		}
	}

	return compare(leftLength, rightLength);
}

/**
 * @ignore
 */
export function reverse(order: Order): Order {
	if (order < 0) {
		return 1;

	} else if (order > 0) {
		return -1;

	} else {
		return 0;
	}
}

/**
 * @ignore
 */
export function compareNumber(a: number, b: number): Order {
	if (a === b) {
		return 0;

	} else if (a < b) {
		return -1;

	} else {
		return 1;
	}
}
