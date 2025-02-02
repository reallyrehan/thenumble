from flask import Flask, render_template, request, jsonify, session, redirect
from flask_fontawesome import FontAwesome
from datetime import datetime
from collections import defaultdict
from utils import new_equation_generator
import os
from dotenv import load_dotenv
import urllib.parse
import redis
# from threading import Thread

load_dotenv()

app = Flask(__name__)
fa = FontAwesome(app)

app.secret_key = os.getenv('NUMBLE_FLASK_SECRET_KEY', 'my_secret_key')

seed_equation_dict = {}
numble_score_distribution = {}
char_list = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '/', '*']

# Connect to Redis
url = urllib.parse.urlparse(os.environ.get('REDISCLOUD_URL'))
redis_connector = redis.Redis(host=url.hostname,
                              port=url.port,
                              password=url.password)

NUMBLE_ENV_VAR = os.getenv('NUMBLE_ENV', 'local')

print(f"NUMBLE_ENV: {NUMBLE_ENV_VAR}")

@app.route('/getRedisStats', methods=['GET'])
def get_redis_stats():
    if 'today_seed' not in session:
        return jsonify({'error': 'Session not initialized'}), 400

    try:
        best_time = False

        get_all_redis = redis_connector.mget([f'{NUMBLE_ENV_VAR}_total_games',
                                            f'{NUMBLE_ENV_VAR}_total_wins',
                                            f'{NUMBLE_ENV_VAR}_total_losses',
                                            f'{NUMBLE_ENV_VAR}_total_guesses',
                                            f'{NUMBLE_ENV_VAR}_total_time_played',
                                            f'{NUMBLE_ENV_VAR}_today_games',
                                            f'{NUMBLE_ENV_VAR}_today_wins',
                                            f'{NUMBLE_ENV_VAR}_today_losses',
                                            f'{NUMBLE_ENV_VAR}_today_guesses',
                                            f'{NUMBLE_ENV_VAR}_today_time_played',
                                            f'{NUMBLE_ENV_VAR}_today_min_time_played'])
        
        if int(get_all_redis[4]) == 0:
            total_avg_time_played = -1
        else:
            total_avg_time_played = int(get_all_redis[4]) / int(get_all_redis[0])

        if int(get_all_redis[9]) == 0:
            today_avg_time_played = -1
        else:
            today_avg_time_played = int(get_all_redis[9]) / int(get_all_redis[5])

        if get_all_redis[10] is None:
            today_min_time_played = -1
        else:
            today_min_time_played = int(get_all_redis[10])

        if session.get('won_status',0) == 1:
            if session.get('time_played',0) == today_min_time_played:
                best_time = True

        return jsonify({
            'total_games': int(get_all_redis[0]),
            'total_wins': int(get_all_redis[1]),
            'total_losses': int(get_all_redis[2]),
            'total_guesses': int(get_all_redis[3]),
            'total_time_played': int(get_all_redis[4]),
            'total_avg_time_played': total_avg_time_played,
            'today_games': int(get_all_redis[5]),
            'today_wins': int(get_all_redis[6]),
            'today_losses': int(get_all_redis[7]),
            'today_guesses': int(get_all_redis[8]),
            'today_time_played': int(get_all_redis[9]),
            'today_avg_time_played': today_avg_time_played,
            'today_min_time_played': today_min_time_played,
            'today_best_time': best_time
        })
    except Exception as e:
        print("Problem getting stats from redis")
        print(e)
        return jsonify({'total_games': 0,
                        'total_wins': 0,
                        'total_losses': 0,
                        'total_guesses': 0,
                        'total_time_played': 0,
                        'total_avg_time_played': -1,
                        'today_games': 0,
                        'today_wins': 0,
                        'today_losses': 0,
                        'today_guesses': 0,
                        'today_time_played': 0,
                        'today_avg_time_played': -1,
                        'today_min_time_played': -1,
                        'today_best_time': False
                        })


def set_redis_stats(today_seed,
                    game_status,
                    total_guesses,
                    time_played):
    try:
        # print("Setting redis stats")

        today_seed_redis, today_min_time_played = redis_connector.mget([f'{NUMBLE_ENV_VAR}_today_seed',
                                                                        f'{NUMBLE_ENV_VAR}_today_min_time_played'])

        today_seed_redis = today_seed_redis.decode('utf-8')

        if today_min_time_played is not None:
            today_min_time_played = int(today_min_time_played)
        else:
            today_min_time_played = -1

        with redis_connector.pipeline() as pipe:
            pipe.incr(f'{NUMBLE_ENV_VAR}_total_games')
            pipe.incr(f'{NUMBLE_ENV_VAR}_total_wins') if game_status == 1 else pipe.incr(f'{NUMBLE_ENV_VAR}_total_losses')
            pipe.incr(f'{NUMBLE_ENV_VAR}_total_guesses', total_guesses)
            pipe.incr(f'{NUMBLE_ENV_VAR}_total_time_played', time_played)

            if today_seed_redis == today_seed:
                print("Setting today stats")
                pipe.incr(f'{NUMBLE_ENV_VAR}_today_games')
                pipe.incr(f'{NUMBLE_ENV_VAR}_today_wins') if game_status == 1 else pipe.incr(f'{NUMBLE_ENV_VAR}_today_losses')
                pipe.incr(f'{NUMBLE_ENV_VAR}_today_guesses', total_guesses)
                pipe.incr(f'{NUMBLE_ENV_VAR}_today_time_played', time_played)

                if today_min_time_played==-1 or time_played <= today_min_time_played:
                    pipe.set(f'{NUMBLE_ENV_VAR}_today_min_time_played', time_played)
                    
            pipe.execute()
    except Exception as e:
        print("Problem setting stats for redis")
        print(e)
        


def next_word_time():
    today = datetime.now()
    return f"{23 - today.hour} hours and {59 - today.minute} minutes"

def initialise_redis_seed(seed):
    try:
        today_seed_redis = redis_connector.get(f'{NUMBLE_ENV_VAR}_today_seed')

        if today_seed_redis is not None:
            today_seed_redis = today_seed_redis.decode('utf-8')
        else:
            today_seed_redis = ""

        if today_seed_redis == seed:
            print("Today seed already exists in redis")
        else:
            print("Initialising redis for today seed")

            redis_connector.mset({
                f'{NUMBLE_ENV_VAR}_today_seed': seed,
                f'{NUMBLE_ENV_VAR}_today_games': 0,
                f'{NUMBLE_ENV_VAR}_today_wins': 0,
                f'{NUMBLE_ENV_VAR}_today_losses': 0,
                f'{NUMBLE_ENV_VAR}_today_guesses': 0,
                f'{NUMBLE_ENV_VAR}_today_time_played': 0,
                f'{NUMBLE_ENV_VAR}_today_min_time_played': -1
            })

    except:
        print("Problem initialising redis seed")
        pass

def generator():
    seed = session['today_seed']

    if seed in seed_equation_dict:
        print("GETTING CACHED VALUE")
        return seed_equation_dict[seed]['equation'], seed_equation_dict[seed]['value']

    print("CREATED EQUATION")
    initialise_redis_seed(seed)

    final_true, eval_result = new_equation_generator(seed)

    seed_equation_dict[seed] = {'equation': final_true, 'value': eval_result}

    return final_true, eval_result


def evaluator(inp):
    if len(inp) != 7:
        return False, 'Invalid Length'

    for i in inp:
        if i not in char_list:
            return False, 'Invalid Character'

    try:
        if eval(''.join(inp)) != get_truth_ans():
            return False, 'Equation Unsolved'

    except:
        return False, 'Invalid Equation'

    return True, None


def get_truth_value():
    return generator()[0]  # '2*35+11'


def get_truth_ans():
    truth_st = get_truth_value()
    truth_ls = list(truth_st)
    truth_value = eval(''.join(truth_ls))
    return int(truth_value)


def checker(inp):
    truth_st = get_truth_value()
    truth_ls = list(truth_st)
    truth_dict = defaultdict(int)

    for i in truth_st:
        truth_dict[i] += 1

    result_ls = []
    eval_status, error_message = evaluator(inp)

    print("Eval status: {} {}".format(eval_status, error_message))

    if eval_status:  # Remove this to perform regex to avoid code vulnerability

        for c, tup in enumerate(zip(inp, truth_ls)):
            i, j = tup
            if i == j:
                truth_dict[i] -= 1
                result_ls.append((c, 1, i))

        for c, tup in enumerate(zip(inp, truth_ls)):
            i, j = tup

            if i != j and i in truth_ls:
                if truth_dict[i] > 0:
                    truth_dict[i] -= 1
                    result_ls.append((c, 0, i))

        test_ls = [i[0] for i in result_ls]
        for i in range(0, 7):
            if i not in test_ls:
                result_ls.append((i, -1, inp[i]))

    else:
        return result_ls, -1

    session['total_guesses'] += 1

    if inp == truth_st:
        return result_ls, 1, ""
    else:
        return result_ls, 0, ""


def get_seed():
    today = datetime.now()
    year, month, day = str(today.year), str(today.month), str(today.day)

    month = month if len(month) == 2 else '0' + month
    day = day if len(day) == 2 else '0' + day

    return year + month + day #+ str(round(today.second/15)) ## Testing


def get_day_count():
    start_date = datetime.strptime('Jan 31 2022', '%b %d %Y')
    cur_date = datetime.now()
    numble_word_count = (cur_date - start_date).days
    return numble_word_count


def get_var_seed(seed_str):
    try:
        return int(''.join([str(ord(i) % 100) for i in seed_str]))
    except:
        return 97


def add_score(sc_int):
    try:
        if session['today_seed'] not in numble_score_distribution:
            numble_score_distribution[session['today_seed']] = [0] * 7

        if sc_int == -1:
            numble_score_distribution[session['today_seed']][-1] += 1
        else:
            numble_score_distribution[session['today_seed']][sc_int - 1] += 1
    except:
        print("Problem adding global scores")
        pass

# Testing method

@app.route('/reset')
def test_session():
    if os.getenv('NUMBLE_ENV')=='local':
        print("Resetting session")
        session.clear()
        return redirect('/')
    else:
        print("Not allowed")
        return redirect('/')

def initialize_session(seed, new_session=True):
    if 'last_played' in session and session['last_played'] == seed:
        new_session = False

    if new_session:
        session.permanent = True
        session['total_guesses'] = 0
        session['guess_history'] = []
        session['won_status'] = 0
        session['start_time'] = int(datetime.now().timestamp())
        session['time_played'] = -1

    session['today_seed'] = seed

    if 'dark_mode' not in session:
        session['dark_mode'] = False


def get_feedback_color():
    feedback = []
    for row in session['guess_history']:
        guess = []
        for box in row:
            guess.append(box[1])
        feedback.append(guess)
    return feedback


def get_guesses():
    guesses = []
    for row in session['guess_history']:
        guess = []
        for box in row:
            guess.append(box[2])
        guesses.append(guess)
    return guesses


@app.route('/dark')
def dark():
    if 'dark_mode' in session:
        session['dark_mode'] = not session['dark_mode']
    else:
        session['dark_mode'] = True

    if session['generate']:
        return redirect('/mynumble/' + str(session['generate_key']))
    else:
        return redirect('/')


@app.route('/mynumble/<var>')
@app.route('/mynumble/')
def index_seed(var=""):
    if len(var) == 0:
        var = "a"
    var = var[0:6]
    seed = get_var_seed(var)

    initialize_session(seed)

    session['generate'] = True
    session['generate_key'] = var

    print("Today seed: " + str(session['today_seed']))
    print("Answer: " + str(get_truth_value()))
    print("Total guesses: " + str(session['total_guesses']))

    return render_template('index.html',
                           answer_value=get_truth_ans(),
                           total=session['total_guesses'],
                           history=get_feedback_color(),
                           labels=get_guesses(),
                           won_status=session["won_status"],
                           numble_day_count="#mynumble: " + var,
                           global_remaining_time=next_word_time(),
                           dark_mode=session['dark_mode'],
                           time_played=session['time_played'],
                           avg_time_played=-1,
                           start_time=session['start_time'])


@app.route('/')
def index():
    seed = get_seed()
    print("Seed: " + seed)

    initialize_session(seed)

    if 'scores' not in session:
        session['scores'] = defaultdict(int)

    if 'avg_time_played' not in session:
        session['avg_time_played'] = -1

    if 'start_time' not in session:
        session['start_time'] = int(datetime.now().timestamp())

    if 'time_played' not in session:
        session['time_played'] = -1

    session['generate'] = False

    print("Answer: " + str(get_truth_value()))
    print("Total guesses: " + str(session['total_guesses']))

    print("Time played: " + str(session['time_played']))
    print(session['avg_time_played'])

    print(session['start_time'])

    return render_template('index.html',
                           answer_value=get_truth_ans(),
                           total=session['total_guesses'],
                           history=get_feedback_color(),
                           labels=get_guesses(),
                           won_status=session["won_status"],
                           numble_day_count="# " + str(get_day_count()),
                           global_remaining_time=next_word_time(),
                           dark_mode=session['dark_mode'],
                           time_played=session['time_played'],
                           avg_time_played=session['avg_time_played'],
                           start_time=session['start_time'])


@app.route('/getScores', methods=['GET'])
def get_scores():
    score_distribution = [0] * 7

    if 'scores' in session:
        for i in session['scores']:
            if session['scores'][i] == -1:
                score_distribution[-1] += 1
            else:
                score_distribution[session['scores'][i] - 1] += 1

        return jsonify({'distribution': score_distribution, 'played': len(session['scores']),
                        'won': sum(score_distribution[0:-1])})
    else:

        return jsonify({'distribution': score_distribution, 'played': 0, 'won': 0})


@app.route('/getNumbleScores', methods=['GET'])
def get_numble_scores():
    if 'today_seed' in session:
        cur_seed = session['today_seed']
    else:
        cur_seed = get_seed()

    if cur_seed not in numble_score_distribution:
        numble_score_distribution[cur_seed] = [0] * 7

    temp_distribution = numble_score_distribution[cur_seed]

    played, won = sum(temp_distribution), sum(temp_distribution[0:-1])

    if played > 0:
        numble_percent = list(map(lambda a: int((a / played) * 100), temp_distribution))
    else:
        numble_percent = [0] * 7

    return jsonify(
        {'numble_distribution': temp_distribution,
         'played': played,
         'won': won,
         'numble_percent': numble_percent
         })


@app.route('/submit', methods=['POST'])
def submit():
    if request.method == 'POST':
        if request.json['total_guesses'] != session['total_guesses']:
            return jsonify({'value': [], 'ls': [], 'labels': [], 'next_word_time': next_word_time(),
                            'session_total': session['total_guesses']})

        session['time_played'] = int(datetime.now().timestamp()) - session['start_time']
        avg_time_played = session['avg_time_played']

        inp = request.json['guess'][0:request.json['cur_count']]

        results = checker(inp)
        ls = [i[1] for i in sorted(results[0], key=lambda a: a[0])]
        label_ls = [i[2] for i in sorted(results[0], key=lambda a: a[0])]

        if results[1] != -1:
            # Next guess
            session['guess_history'].append([i for i in sorted(results[0], key=lambda a: a[0])])

        if results[1] == 1:
            # Won
            session['won_status'] = results[1]

            if (not session['generate']) and ('scores' in session):
                session['scores'][session['today_seed']] = session['total_guesses']

                add_score(session['total_guesses'])

                total_won = len([numble for numble in session['scores'] if numble[-1]!=0])

                if session['avg_time_played'] == -1:
                    session['avg_time_played'] = session['time_played']
                else:
                    session['avg_time_played'] = (session['avg_time_played']*(total_won-1) + session['time_played'])/(total_won)

                # Game Win Stats
                set_redis_stats(today_seed = session["today_seed"],
                                game_status=1,
                                total_guesses=session['total_guesses'],
                                time_played=session['time_played']
                )


        elif session['total_guesses'] >= 6:
            # Loss
            session['won_status'] = -1

            if (not session['generate']) and ('scores' in session):
                session['scores'][session['today_seed']] = -1
                add_score(-1)

                # Game Lose Stats
                set_redis_stats(today_seed = session["today_seed"],
                                game_status=0,
                                total_guesses=session['total_guesses'],
                                time_played=session['time_played']
                )

        session['last_played'] = session['today_seed']

        print("Total guesses: " + str(session['total_guesses']))

    return jsonify({'value': results[1],
                    'ls':ls,
                    'labels': label_ls,
                    'next_word_time': next_word_time(),
                    'session_total': session['total_guesses'],
                    'equation': get_truth_value(),
                    'time_played': session['time_played'],
                    'avg_time_played':avg_time_played})


if __name__ == '__main__':
    app.run(host='localhost', debug=True, port=5001)  # FIX
